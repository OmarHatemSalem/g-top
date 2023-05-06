use sysinfo::*;
use std::collections::HashMap;
use std::process::Command;
use rustix::process::Pid as rPid;
use rustix::process::setpriority_process;

#[path = "./pstree.rs"]
mod pstree;


/// Given [`PID`], first checks that it is valid
/// 
/// If so, kills the process and returns [`true`]
/// else returns [`false`]
#[tauri::command]
pub fn kill_proc(pid: u32) -> bool {
    let mut sys = sysinfo::System::new();
    sys.refresh_processes();
    std::thread::sleep(std::time::Duration::from_millis(500));
    sys.refresh_processes();

    let sys_procs: &HashMap<Pid, Process> = sys.processes();
    let kproc = sys_procs.get(&Pid::from_u32(pid));

    match kproc {
        Some(x) => {x.kill(); return true;},
        None => {return false;}

    }
    
} 

#[tauri::command]
pub fn pause_proc(pid: u32) -> bool {
    let mut sys = sysinfo::System::new();
    sys.refresh_processes();
    std::thread::sleep(std::time::Duration::from_millis(500));
    sys.refresh_processes();

    let sys_procs: &HashMap<Pid, Process> = sys.processes();
    let kproc = sys_procs.get(&Pid::from_u32(pid));


    match kproc {
        Some(x) => {
            
            if x.status() != ProcessStatus::Stop {
                
                let pause = Command::new("kill").args(["-STOP", &(x.pid().as_u32()).to_string()]).status();
                
                if pause.is_ok() {return true;}
                else {return false;}
            } else {
                let resume = Command::new("kill").args(["-CONT", &(x.pid().as_u32()).to_string()]).status();
                
                if resume.is_ok() {return true;}
                else {return false;}
            }
        },
        None => {return false;}

    }
    
} 

#[tauri::command]
pub fn set_priority(pid : u32, priority: i32) -> bool {
    unsafe {let rpid = rPid::from_raw(pid); 

    if rpid.is_none() {
        println!("Rpid does not work\n");
    }

    if setpriority_process(rpid, priority).is_ok() {
        println!("It works\n"); return true;
    } else {
        println!("Error occured\n"); return false;
    }

    }

}

#[tauri::command]
pub fn kill_proc_rec(pid: u32) -> bool {

    let procs = pstree::get_process_tree(pid);
    
    for p in procs {
        if !kill_proc(p as u32) {return false;}
    }

    return true;
    
} 

#[tauri::command]
pub fn pause_proc_rec(pid: u32) -> bool {

    let procs = pstree::get_process_tree(pid);
    
    for p in procs {
        if !pause_proc(p as u32) {return false;}
    }

    return true;
    
}
