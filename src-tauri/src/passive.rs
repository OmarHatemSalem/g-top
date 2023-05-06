use std::{error::Error, io};
use sysinfo::*;
use std::collections::HashMap;
use rustix::process::getpriority_process;
use rustix::process::Pid as rPid;
use serde::ser::{Serialize, SerializeStruct, Serializer};
use psutil::process::Process as PsProcess;
use std::result::Result as StdResult;
use libc::{getpriority,setpriority,c_int, pid_t, PRIO_PROCESS};
// use native_dialog::{FileDialog, MessageDialog, MessageType};

#[path = "./pstree.rs"]
mod pstree;

/// Helper function to convert [`ProcessStatus`] struct to [`String`]


/// Main struct that will be sent to frontend
pub struct SimpleProc {
    ///Process Name
    pub name: String,
    ///Process PID
    pub pid : u32,
    ///Process PID
    pub state: String,
    ///Process Priority
    pub priority: i32,
    /// Process PPID
    pub parent: u32,
    ///Process CPU Usage
    pub cpu_usage: f32,
    ///Process Mem Usage
    pub mem_usage: f64,
    ///User ID
    pub user_id: u32,
    ///Runtime
    pub run_time: u64,
    
}

///Implements [`Serialize`] to be able to send to frontend
impl Serialize for SimpleProc {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        let mut s = serializer.serialize_struct("SimpleProc", 6)?;
        s.serialize_field("name", &self.name)?;
        s.serialize_field("pid", &self.pid)?;
        s.serialize_field("state", &self.state)?;
        s.serialize_field("priority", &self.priority)?;
        s.serialize_field("parent", &self.parent)?;
        s.serialize_field("cpu_usage", &self.cpu_usage)?;
        s.serialize_field("mem_usage", &self.mem_usage)?;
        s.serialize_field("run_time", &self.run_time)?;
        s.serialize_field("user_id", &self.user_id)?;
        s.end()
    }
}

fn get_niceness(pid: u32) -> Result<i32, nix::Error> {
    // let pid_t = pid as pid_t;
    let priority = unsafe { getpriority(PRIO_PROCESS, pid) };
    if priority == -1 {
        Err(nix::Error::last())
    } else {
        Ok(priority)
    }
}


///Sends list of processes to backend
#[tauri::command]
pub fn get_processes() -> /*HashMap<u32,*/ Vec<SimpleProc> {
    let mut sys = sysinfo::System::new_with_specifics(RefreshKind::everything().without_users_list());
    sys.refresh_processes();


    std::thread::sleep(std::time::Duration::from_millis(250));
    sys.refresh_processes();
    let sys_procs: &HashMap<Pid, Process> = sys.processes();
    let all_procs = Vec::from_iter(sys_procs.iter());

    
    let simple_procs: Vec<SimpleProc> = all_procs.into_iter().map(
        |x| SimpleProc{
            name: String::from((x.1).name()),
            pid:(x.0).as_u32(), 
            state: pstree::to_char((x.1).status()),
            parent:(x.1).parent().unwrap_or(Pid::from_u32(0)).as_u32(),
            cpu_usage: (x.1).cpu_usage() / (4 as f32),
            mem_usage: ((x.1).memory() as f64 / sys.total_memory() as f64) * 100.0,
            priority: match get_niceness((x.0).as_u32()){
                Ok(n) => n,
                Err(e) => 0,
            },
            run_time: (x.1).run_time(),
            user_id:  match x.1.user_id(){
                Some(uid) => **uid,
                None => 0
            },


        }
    ).collect();
  
    return simple_procs;

}

#[tauri::command]
pub fn get_curr_total_cpu() -> Vec<f32> {

    let mut sys = System::new();

        
    sys.refresh_cpu(); // Refreshing CPU information.
    
    // Sleeping for 500 ms to let time for the system to run for long
    // enough to have useful information.

    
    std::thread::sleep(std::time::Duration::from_millis(500));
    sys.refresh_cpu();

    let cpu_use : Vec<f32> =  sys.cpus().iter().map(|x| x.cpu_usage()).collect();
    
    return cpu_use;
}

#[tauri::command]
pub fn get_memory_data() -> Vec<f32> {
    let mut sys = System::new();

    // loop {
        
    sys.refresh_memory(); // Refreshing CPU information.
        
    // Sleeping for 500 ms to let time for the system to run for long
    // enough to have useful information.

    
    std::thread::sleep(std::time::Duration::from_millis(500));
    sys.refresh_memory();

    let memory_used : f32 =  sys.used_memory() as f32 / sys.total_memory() as f32 * 100.0;
    let memory_swapped : f32 = sys.used_swap() as f32 / sys.total_swap() as f32 * 100.0;

    let mut data : Vec<f32> = Vec::<f32>::new();
    data.push(memory_used);
    data.push(memory_swapped);
    
    return data;    
}


#[tauri::command]
pub fn get_process_data(pid : u32) -> Vec<f32> {
    let mut sys = System::new();

    // loop {
        
    sys.refresh_processes(); // Refreshing CPU information.
        
    // Sleeping for 500 ms to let time for the system to run for long
    // enough to have useful information.

    
    std::thread::sleep(std::time::Duration::from_millis(500));
    sys.refresh_processes();

    let mut data : Vec<f32> = Vec::<f32>::new();
    let sys_procs: &HashMap<Pid, Process> = sys.processes();
    let kproc = sys_procs.get(&Pid::from_u32(pid));

    match kproc {
        Some(x) => {data.push(x.cpu_usage() as f32 / 4.0); data.push(x.memory() as f32 / (1024.0*1024.0));  return data;},
        None => {return Vec::new();}

    }

      
}
// #[tauri::command]
// pub fn get_network_data() -> Vec<f32> {
//     let mut sys = System::new();

//     // loop {
        
//     sys.refresh_networks(); // Refreshing CPU information.
        
//     // Sleeping for 500 ms to let time for the system to run for long
//     // enough to have useful information.

    
//     std::thread::sleep(std::time::Duration::from_millis(500));
//     sys.refresh_networks(); // Refreshing CPU information.

//     let write_speed : f32 =  sys.networks()
//     let read_speed : f32 = sys.used_swap() as f32 / sys.total_swap() as f32 * 100.0;

//     let mut data : Vec<f32> = Vec::<f32>::new();
//     data.push(memory_used);
//     data.push(memory_swapped);
    
//     return data;    
// }

#[tauri::command]
pub fn print_tree() -> pstree::ProcessTreeNode {
    println!("called\n");
    return pstree::get_tree();
}

// #[tauri::command]
// pub fn write_csv() -> Result<(), Box<dyn Error>> {

//     let path = FileDialog::new()
//         .set_location("~/Desktop")
//         .show_open_single_dir()
//         .unwrap();

//     let path = match path {
//         Some(path) => path,
//         None => return,
//     };

//     let mut wtr = csv::Writer::from_path(path);

//     // When writing records with Serde using structs, the header row is written
//     // automatically.
//     let data = get_processes();

//     for p in data {
//         wtr.serialize(p)?;
//     }
//     wtr.flush()?;

//     Ok(());
// }