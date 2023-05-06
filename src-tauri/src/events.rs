
// extern crate timer;
use chrono::*;

use psutil::cpu::os::linux::CpuTimesPercentExt;
use sysinfo::*;
use psutil::*;

use serde::Serialize;

use std::thread;
use std::time::Duration;

const IOWAIT_W_THRESHOLD: f32 = 0.10;
const IOWAIT_C_THRESHOLD: f32 = 0.25;

const SWAP_W_THRESHOLD: f32 = 75.0;
const SWAP_C_THRESHOLD: f32 = 90.0;

// const IDLE_W_THRESHOLD: f32 = 0.25;
// const IDLE_C_THRESHOLD: f32 = 0.10;

const CPU_W_THRESHOLD: f32 = 75.0;
const CPU_C_THRESHOLD: f32 = 90.0;



#[derive(Debug, Serialize)]
pub struct Event {

    pub begin: String , //DateTime<Utc>,
    pub state: String,
    pub category: String, //EventType,
    pub value: f32,
    pub top_three: String, //Option<Vec<String>>,
    pub description: String,
}


impl Event {
    fn new() -> Self {
        Self {
            begin : chrono::DateTime::<Utc>::MIN_UTC.to_string(),
            state : String::from("normal"),
            category : String::from("SAFE"),
            value : -1.0,
            top_three : String::from("-"),
            description : String::from("empty event"),
        }
    }

    fn set_begin(&mut self, b : DateTime<Utc>) {
        self.begin = b.to_string();
    }
    
    fn set_state(&mut self, b : String) {
        self.state = b;
    }
    fn set_category(&mut self, b : String) {
        self.category = b;
    }
    fn set_value(&mut self, b : f32) {
        self.value = b;
    }
    fn set_top(&mut self, b : String) {
        self.top_three = b;
    }
    fn set_desc(&mut self, b : String) {
        self.description = b;
    }
}


#[tauri::command]
pub fn check_event() -> Vec<Event>  {
    
    let mut table =  Vec::<Event>::new();  
    
    let block_time = Duration::from_millis(500);

	let mut cpu_times_percent_collector = cpu::CpuTimesPercentCollector::new().unwrap();

    thread::sleep(block_time);
    let cpu_times_percent_percpu = cpu_times_percent_collector
    .cpu_times_percent_percpu()
    .unwrap();

    let swap_memory = memory::swap_memory().unwrap();
    let mut sys = sysinfo::System::new();
    sys.refresh_cpu(); // Refreshing CPU information.
        
    std::thread::sleep(block_time);
    sys.refresh_cpu();

    
    sys.refresh_processes();
    let mut top_process = Vec::from_iter(sys.processes().iter());//
    top_process.sort_by_key(|k| (k.1).memory()); top_process.reverse();
    
    dbg!(top_process[0].1.memory());
    let cpus : f32 = sys.cpus().len()  as f32;
    let idle : f32 =  /*100.0 -*/ cpu_times_percent_percpu.iter().map(|x| x.idle() as f32).collect::<Vec<f32>>().iter().sum::<f32>() / cpus;
    let iw : f32 =  /*100.0 -*/ cpu_times_percent_percpu.iter().map(|x| x.iowait() as f32).collect::<Vec<f32>>().iter().sum::<f32>() / cpus;
    let cpu_use : f32 =  sys.cpus().iter().map(|x| x.cpu_usage()).sum::<f32>() / cpus;

    dbg!(idle);
    dbg!(iw);
	dbg!(&cpu_times_percent_percpu[0].idle());
    dbg!(&cpu_times_percent_percpu[0].iowait());
    dbg!(&cpu_use);
    dbg!(&cpus);

	dbg!(swap_memory.percent());

    let swap_per = swap_memory.percent(); //swapMem.percent();

    let init_date = DateTime::<Utc>::from(chrono::offset::Local::now());
    
    if swap_per >= SWAP_W_THRESHOLD {
            let mut x = Event::new();
            x.set_begin(init_date);
            x.set_desc(String::from("High RAM Usage"));
            if swap_per> SWAP_C_THRESHOLD {x.set_state(String::from("C"));} else {x.set_state(String::from("W"));}
            
            top_process.sort_by_key(|k| (k.1).memory()); top_process.reverse();
            let top3 = top_process.as_slice()[0..3].iter().map(|x| String::from(x.1.name())).collect::<Vec<String>>();
            
            x.set_top(top3.join(", "));
            x.set_value(-1.0);
            x.set_category(String::from("RAM"));
            // x.set_sor(0);
            
            table.push(x);
            
    } //RAM Problem
    
    if iw >= IOWAIT_W_THRESHOLD {
            let mut x = Event::new();
            x.set_begin(init_date);
            x.set_desc(String::from("High Swap Memory Usage"));
            if iw > IOWAIT_C_THRESHOLD {x.set_state(String::from("C"));} else {x.set_state(String::from("W"));}
            
            top_process.sort_by_key(|k| (k.1).disk_usage().written_bytes); top_process.reverse();
            let top3 = top_process.as_slice()[0..3].iter().map(|x| String::from(x.1.name())).collect::<Vec<String>>();
            x.set_top(top3.join(", "));
            
            x.set_value(-1.0);
            x.set_category(String::from("IO"));
            // x.set_sor(0);
            
            table.push(x);
    } // I/O Problem

    // if idle >=IDLE_W_THRESHOLD {
    //         // x.set_begin(init_date);
    //         // x.set_desc(String::from("Some App Usage"));
    //         // x.set_state(String::from("W"));
   
    //         // top_process.sort_by_key(|k| (k.1).memory()); top_process.reverse();
    //         // let top3 = top_process.as_slice()[0..3].iter().map(|x| String::from(x.1.name())).collect::<Vec<String>>();
    //         // x.set_top(String::from("-"));

    //         // x.set_value(-1.0);
    //         // x.set_category(String::from("APP"));
    //         // x.set_sor(0);
            
    //         // table.push(x);
    // } // App Problem
    
    if cpu_use >= CPU_W_THRESHOLD {
            let mut x = Event::new();
            x.set_begin(init_date);
            x.set_desc(String::from("High CPU Usage"));
            if cpu_use> CPU_C_THRESHOLD {x.set_state(String::from("C"));} else {x.set_state(String::from("W"));}

            top_process.sort_by(|a, b| (a.1.cpu_usage()).partial_cmp(&b.1.cpu_usage()).unwrap()); top_process.reverse();
            let top3 = top_process.as_slice()[0..3].iter().map(|x| String::from(x.1.name())).collect::<Vec<String>>();
            x.set_top(top3.join(", "));

            x.set_value(-1.0);
            x.set_category(String::from("CPU"));
            // x.set_sor(0);
            
            table.push(x);
    } //CPU Problem
    

    dbg!(&table);
    return table;



} 


// pub fn main()
// {   
//     let mut t = Vec::<Event>::new();
//     // dbg!(t);
//     // check_event(&mut t);
//     dbg!(t);
// }

// pub fn get_events() -> Vec<Event> {}
// pub fn add_event(event_state: String, event_type:String, event_value:f32, proc_list: Option<Vec<String>>, proc_desc: String) -> bool {

//     if event_state == "WARNING" || event_state == "CRITICAL" {
//         let priority = if (event_state == "WARNING") {0} else {1};
//         let e1 = Event {
//             date_naive(),
//             date_naive(),
//             event_state,
//             event_type,
//             proc_list,
//             proc_desc,
//             priority
//         };

//         return 

//     }

// }


/*
def _create_event(self, event_state, event_type, event_value, proc_list, proc_desc, peak_time):
        """Add a new item in the log list.

        Item is added only if the criticality (event_state) is WARNING or CRITICAL.
        """
        if event_state == "WARNING" or event_state == "CRITICAL":
            # Define the automatic process sort key
            self.set_process_sort(event_type)

            # Create the new log item
            # Time is stored in Epoch format
            # Epoch -> DMYHMS = datetime.fromtimestamp(epoch)
            item = [
                time.mktime(datetime.now().timetuple()),  # START DATE
                -1,  # END DATE
                event_state,  # STATE: WARNING|CRITICAL
                event_type,  # TYPE: CPU, LOAD, MEM...
                event_value,  # MAX
                event_value,  # AVG
                event_value,  # MIN
                event_value,  # SUM
                1,  # COUNT
                [],  # TOP 3 PROCESS LIST
                proc_desc,  # MONITORED PROCESSES DESC
                glances_processes.sort_key,
            ]  # TOP PROCESS SORT KEY

            # Add the item to the list
            self.events_list.insert(0, item)

            # Limit the list to 'events_max' items
            if self.len() > self.events_max:
                self.events_list.pop()

            return True
        else:
            return False
 */