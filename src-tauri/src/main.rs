mod events;
mod passive;
mod active;

fn main() {

    tauri::Builder::default()
    .invoke_handler(tauri::generate_handler![passive::get_processes, passive::get_curr_total_cpu, passive::get_memory_data, passive::print_tree,
                                             passive::get_process_data, /*passive::write_csv ,*/ active::kill_proc, active::set_priority, active::kill_proc_rec, active::pause_proc,
                                             passive::get_childern, active::pause_proc_rec, events::check_event])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");

}