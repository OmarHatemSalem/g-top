// A version of pstree targetting linux written in rust!
//
// This is based on the following exercise from the excellent
// book "The Linux Programming Interface" by Michael Kerridsk.
//
//----------------------------------------------------------------------
//
// Write a program that draws a tree showing the hierarchical
// parent-child relationships of all processes on the system, going all
// the way back to init.  For each process, the program should display
// the process ID and the command being executed.  The output of the
// program should be similar to that produced by pstree(1), although it
// does need not to be as sophisticated.  The parent of each process on
// the system can be found by inspecing the PPid: line of all of the
// /proc/PID/status files on the system.  Be careful to handle the
// possibilty that a process's parent (and thus its /proc/PID directory)
// disappears during the scan of all /proc/PID directories.

// Implementation Notes
// --------------------
// The linux /proc filesystem is a virtual filesystem that provides information
// about processes running on a linux system among other things.  The /proc
// filesystem contains a directory, /proc/<pid>, for each running process in
// the system.
//
// Each process directory has a status file with contents including a bunch
// of different items, notably the process name and its parent process id (ppid).
// And with that information, we can build the process tree.

use std::path::Path;
use std::fs;
use std::io::prelude::*;
use std::fs::File;
use std::collections::hash_map::Entry::{Occupied, Vacant};
use std::collections::HashMap;

use sysinfo::*;
use rustix::process::getpriority_process;
use rustix::process::Pid as rPid;

use serde::Serialize;

#[derive(Clone,Debug, Serialize, Default)]
struct ProcessRecord {
    // name: String,
    // pid: i32,
    // ppid: i32,
// }

// pub struct SimpleProc {
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
    pub mem_usage: f32
    
}

#[derive(Clone,Debug, Serialize)]
pub struct ProcessTreeNode {
    record: ProcessRecord,  // the node owns the associated record
    subRows: Vec<ProcessTreeNode>, // nodes own their subRows
}

#[derive(Clone,Debug)]
pub struct ProcessTree {
    pub root: ProcessTreeNode, // tree owns ref to root node
}

impl ProcessTreeNode {
    // constructor
    fn new(record : &ProcessRecord) -> ProcessTreeNode {
        ProcessTreeNode { record: (*record).clone(), subRows: Vec::new() }
    }
}

pub fn to_char(p: ProcessStatus) -> String {
    match p {
        ProcessStatus::Idle => String::from("Idle"),
        ProcessStatus::Run => String::from("Running"),
        ProcessStatus::Sleep => String::from("Sleep"),
        ProcessStatus::Stop => String::from("Stopped"),
        ProcessStatus::Zombie => String::from("Zombie"),
        ProcessStatus::Tracing => String::from("Tracing"),
        ProcessStatus::Dead => String::from("Dead"),
        ProcessStatus::Wakekill => String::from("Killing"),
        ProcessStatus::Waking => String::from("Waking"),
        ProcessStatus::Parked => String::from("Parked"),
        ProcessStatus::UninterruptibleDiskSleep => String::from("UDS"),
        _ => String::from("X")
    }
}


// Given a status file path, return a hashmap with the following form:
// pid -> ProcessRecord
fn get_process_record(status_path: &Path) -> Option<ProcessRecord> {
    let mut pid : Option<i32> = None;
    let mut ppid : Option<i32> = None;
    let mut name : Option<String> = None;

    let mut reader = std::io::BufReader::new(File::open(status_path).unwrap());
    loop {
        let mut linebuf = String::new();
        match reader.read_line(&mut linebuf) {
            Ok(_) => {
                if linebuf.is_empty() {
                    break;
                }
                let parts : Vec<&str> = linebuf[..].splitn(2, ':').collect();
                if parts.len() == 2 {
                    let key = parts[0].trim();
                    let value = parts[1].trim();
                    match key {
                        "Name" => name = Some(value.to_string()),
                        "Pid" => pid = value.parse().ok(),
                        "PPid" => ppid = value.parse().ok(),
                        _ => (),
                    }
                }
            },
            Err(_) => break,
        }
    }
    return if pid.is_some() && ppid.is_some() && name.is_some() {
        Some(ProcessRecord { name: name.unwrap(), pid: pid.unwrap() as u32, parent: ppid.unwrap() as u32, ..Default::default()})
    } else {
        None
    }
}


// build a simple struct (ProcessRecord) for each process
fn get_process_records() -> Vec<ProcessRecord> {
    let mut sys = sysinfo::System::new_with_specifics(RefreshKind::everything().without_users_list());
    sys.refresh_processes();


    std::thread::sleep(std::time::Duration::from_millis(250));
    sys.refresh_processes();
    let sys_procs: &HashMap<Pid, Process> = sys.processes();
    let all_procs = Vec::from_iter(sys_procs.iter());

    
    let simple_procs: Vec<ProcessRecord> = all_procs.into_iter().map(
        |x| ProcessRecord{
            name: String::from((x.1).name()),
            pid:(x.0).as_u32(), 
            state: to_char((x.1).status()),
            priority: unsafe {getpriority_process(rPid::from_raw((x.0).as_u32())).unwrap_or(0) },
            parent:(x.1).parent().unwrap_or(Pid::from_u32(0)).as_u32(),
            cpu_usage: (x.1).cpu_usage() / (4 as f32),
            mem_usage: ((x.1).memory() as f32) / ((1024*1024) as f32)


        }
    ).collect();
  
    return simple_procs;
}

fn populate_node_helper(node: &mut ProcessTreeNode, pid_map: &HashMap<u32, &ProcessRecord>, ppid_map: &HashMap<u32, Vec<u32>>) {
    let pid = node.record.pid; // avoid binding node as immutable in closure
    let child_nodes = &mut node.subRows;
    match ppid_map.get(&pid) {
        Some(subRows) => {
            child_nodes.extend(subRows.iter().map(|child_pid| {
                let record = pid_map[child_pid];
                let mut child = ProcessTreeNode::new(record);
                populate_node_helper(&mut child, pid_map, ppid_map);
                child
            }));
        },
        None => {},
    }
}

fn populate_node(node : &mut ProcessTreeNode, records: &Vec<ProcessRecord>) {
    // O(n): build a mapping of pids to vectors of subRows.  That is, each
    // key is a pid and its value is a vector of the whose parent pid is the key
    let mut ppid_map : HashMap<u32, Vec<u32>> = HashMap::new();
    let mut pid_map : HashMap<u32, &ProcessRecord> = HashMap::new();
    for record in records.iter() {
        // entry returns either a vacant or occupied entry.  If vacant,
        // we insert a new vector with this records pid.  If occupied,
        // we push this record's pid onto the vec
        pid_map.insert(record.pid, record);
        match ppid_map.entry(record.parent) {
            Vacant(entry) => { entry.insert(vec![record.pid]); },
            Occupied(mut entry) => { entry.get_mut().push(record.pid); },
        };
    }

    // With the data structures built, it is off to the races
    populate_node_helper(node, &pid_map, &ppid_map);
}

pub fn build_process_tree() -> ProcessTree {
    let records = get_process_records();
    let mut tree = ProcessTree {
        root : ProcessTreeNode::new(
            &ProcessRecord {
                name: "/".to_string(),
                pid: 0,
                parent: 0,
                ..Default::default()
            })
    };

    // recursively populate all nodes in the tree starting from root (pid 0)
    {
        let root = &mut tree.root;
        populate_node(root, &records);
    }
    tree
}

fn print_node(node : &ProcessTreeNode, indent_level : i32) {
    // print indentation
    for _ in 0..indent_level {
        print!("  ");
    }
    println!("- {} #{}", node.record.name, node.record.pid);
    for child in node.subRows.iter() {
        print_node(child, indent_level + 1);  // recurse
    }
}

pub fn print_tree(ptree : ProcessTree) {
    // print indentation
    print_node(&(ptree.root), 0)
}

pub fn get_all_subRows(pid : u32, node : &ProcessTreeNode, found : bool) -> Vec<u32> {
    // let mut node = ptree.root; 
    let mut subRows : Vec<u32> = Vec::new();
    
    if node.record.pid == pid {
        println!("found start\n");
        subRows.push(pid);
        for p in node.subRows.iter() {
            subRows.append(&mut get_all_subRows(pid, &p, true));
        }

    } else if found {
        println!("continuig in a child\n");
        subRows.push(node.record.pid);
        for p in node.subRows.iter() {
            subRows.append(&mut get_all_subRows(pid, &p, true));
        }
        
    } else {
        println!("still searching\n");
        for p in node.subRows.iter() {
            subRows.append(&mut get_all_subRows(pid, &p, false));
        }
    }
    

    

    return subRows;
}

pub fn get_process_tree(pid : u32)  -> Vec<u32>{
    let ptree = build_process_tree();
    let allProcs = get_all_subRows(pid, &(ptree.root), false);

    return allProcs
}

pub fn get_tree()  -> ProcessTreeNode{
    let ptree = build_process_tree();

    return ptree.root;
}