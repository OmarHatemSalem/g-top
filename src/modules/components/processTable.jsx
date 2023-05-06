import MaterialReactTable from 'material-react-table';
import React, { useMemo } from 'react';
import { ExportToCsv } from 'export-to-csv'; //or use your library of choice here
import { invoke } from "@tauri-apps/api/tauri";
import { useState, useEffect } from 'react';
import FileDownloadIcon from '@mui/icons-material/FileDownload';

import InfoIcon from '@mui/icons-material/Info';
//Material-UI Imports

import {

    Box,
  
    Button,
  
    ListItemIcon,
  
    MenuItem,
  
    Typography,
  
    TextField,
    IconButton,
  
  } from '@mui/material';
import FullScreenDialog from './Modal';


let pause = "Pause"  
let data = [
    {
        pid: "403",
        state: "R",
        parent: "300"
    },
    {
        pid: "3",
        state: "Z",
        parent: "300"
    },
    {
        pid: "500",
        state: "W",
        parent: "0"
      },
    ]
    



const ProcessTable = ({isPause}) => {
  
  
  const [rowData, setRowData] = useState({});
  const [isProcViewOpen, setProcView] = useState(false);
  const [procs, setProcs] = useState("");
  const [rowSelection, setRowSelection] = useState({});
  // const [pids, setPids] = useState([]);  

  async function getProcs() {
    // Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
    
    let newData = await invoke("get_processes") 
    // let newPids = newData.map(x => x["pid"])
    // // newData = newData.map(proc => {this.pid = proc["pid"]; this.data = proc;} )
    // setPids(newPids);
    console.log(newData);
    setProcs(newData/*oldProcs => {
      if 
    }*/);
  }
  
  useEffect(() => {
    if(isPause === true){
      let interval = setInterval(getProcs, 3000);
      return () => {
          clearInterval(interval);
      }

    }


  }, [isPause]
  )
  
  const columns = useMemo(() => [
    {
      accessorKey: 'name',
      header: 'Process',
      size:75,
      Cell: ({ cell, row }) => (
        <div>
          <IconButton onClick={()=>{ 
           setRowData({pid:row.getValue('pid'), name: cell.getValue()}); 
           setProcView(true);
          }

          }
           color="primary" aria-label="upload picture" component="label" >
            <InfoIcon />
            </IconButton>
          {cell.getValue()}
          {/* {row.getValue('pid')} */}
        </div>
      ),
    },
    {
      accessorKey: 'pid',
      header: 'PID',
      size:25,
      
    },
    {
      accessorKey: 'state',
      header: 'State',
      size:25,
      
    },
    {
      accessorKey: 'priority',
      header: 'Priority',
      size:25,
      
    },
    {
      accessorKey: 'parent',
      header: 'Parent',
      size:15,
      
    },
    {
      accessorKey: 'run_time',
      header: 'Run Time (s)',
      size: 15,
    },
    {
      accessorKey: 'user_id',
      header: 'User ID',
      size: 15,
    },
    {
      accessorKey: 'cpu_usage',
      header: 'CPU Usage (%)',
      size:15,
      // Cell: props => (props.getValue()).toFixed(2)
      Cell: ({ cell, row }) => (
        <div>
          {cell.getValue().toFixed(2)}
        </div>
      ),
    },
    {
      accessorKey: 'mem_usage',
      header: 'Memory Usage (%)',
      size:15,
      // Cell: props => (props.getValue()).toFixed(2)
      Cell: ({ cell, row }) => (
        <div>
          {cell.getValue().toFixed(2)} MB
        </div>
      ),
    }    
  ],
  [],)
  console.log(`returned  procs = ${JSON.stringify(procs[0])}`);
  
  
  
  const csvOptions = {
    fieldSeparator: ',',
    quoteStrings: '"',
    decimalSeparator: '.',
    showLabels: true,
    useBom: true,
    useKeysAsHeaders: false,
    headers: columns.map((c) => c.header),
  };
  
  const csvExporter = new ExportToCsv(csvOptions);
  
  const handleExportRows = (rows) => {
      csvExporter.generateCsv(rows.map((row) => row.original));
    };

    const handleExportData = () => {
      // cols  = columns.map(c => c.header);
      // data = procs;
      // const save = procs.forEach(p => {
      //   console.log({
      //     Process: p.name,
      //     PID: p.pid,
      //     State: p.state,
      //     Priority: p.priority,
      //     Parent: p.parent,
      //     CPU: p.cpu_usage,
      //     MEM: p.mem_usage
      // });
      //   save.push({
      //     Process: p.name,
      //     PID: p.pid,
      //     State: p.state,
      //     Priority: p.priority,
      //     Parent: p.parent,
      //     CPU: p.cpu_usage,
      //     MEM: p.mem_usage
      // });
      //   console.log(save);
      // })
      // console.log("new convert");
      // console.log(save);
      csvExporter.generateCsv(procs);
      console.log("Data Written");
    };
        
        
        return (
          <div>
        <MaterialReactTable 
            options={{
                rowStyle: {
                    overflowWrap: 'break-word'
                }
            }}
            columns={columns} data={procs}
            enableColumnResizing 
            enableGrouping
            enablePinning

            muiTableContainerProps={{
              // ref: tableContainerRef, //get access to the table container element
              sx: { maxHeight: '600px' }, //give the table a max height
            //   onScroll: (
            //     event, //add an event listener to the table container element
            //   ) => fetchMoreOnBottomReached(event.target),
            // }}
            }}

            enablePagination={false}
            enableRowSelection
            onRowSelectionChange={setRowSelection}
            state={{ rowSelection }}
            getRowId={(originalRow) => originalRow.pid}
            enableFilterMatchHighlighting
            initialState={{ columnPinning: { left: ['name'] }},{sorting : [{id:'cpu_usage', desc:true}]}}            
            enableColumnDragging={false} //do not show drag handle buttons, but still show grouping options in column actions menu
            //   initialState={{ columnPinning: { left: ['state'] } }} //pin email column to left by default       
        
              renderTopToolbarCustomActions={({ table }) => {
        
                const handleKill = () => {
        
                  table.getSelectedRowModel().flatRows.map((row) => {
        
                    invoke("kill_proc", {pid : row.getValue("pid")});
                    setRowSelection({});
        
                  });
        
                };
                
                const handleKillAll = () => {
        
                  table.getSelectedRowModel().flatRows.map((row) => {
        
                    invoke("kill_proc_rec", {pid : row.getValue("pid")});
                    setRowSelection({});
        
                  });
        
                };
                
                const handlePriority = () => {
        
                  table.getSelectedRowModel().flatRows.map((row) => {
        
                    invoke("set_priority", {pid : row.getValue("pid"), priority : 10})
        
                  });
        
                };  
                
                const handlePause = () => {

                  
                  table.getSelectedRowModel().flatRows.map((row) => {
                    
                    pause = row.getValue("state") === "St" ? "Resume" : "Pause";
                    invoke("pause_proc", {pid : row.getValue("pid")})
        
                  });
        
                };  

                const handlePauseAll = () => {
        
                  table.getSelectedRowModel().flatRows.map((row) => {
        
                    invoke("pause_proc_rec", {pid : row.getValue("pid")})
        
                  });
        
                };  

                return (
        
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
        
                    <Button
        
                      color="error"
        
                      disabled={!table.getIsSomeRowsSelected()}
        
                      onClick={handleKill}
        
                      variant="contained"
        
                    >
        
                      Kill
        
                    </Button>

                    <Button
        
                      color="error"

                      disabled={!table.getIsSomeRowsSelected()}

                      onClick={handleKillAll}

                      variant="contained"

                    >

                      Kill All

                    </Button>

                    <Button
        
                      color="primary"

                      disabled={!table.getIsSomeRowsSelected()}

                      onClick={handlePriority}

                      variant="contained"

                    >

                      Decrease Priority

                    </Button>

                    <Button
        
                      color="success"

                      disabled={!table.getIsSomeRowsSelected()}

                      onClick={handlePause}

                      variant="contained"

                    >

                      {pause}

                    </Button>

                    <Button
        
                      color="success"

                      disabled={!table.getIsSomeRowsSelected()}

                      onClick={handlePauseAll}

                      variant="contained"

                    >

                      Pause All

                    </Button>

                    <Button
                        color="primary"
                        //export all data that is currently in the table (ignore pagination, sorting, filtering, etc.)
                        onClick={handleExportData}
                        startIcon={<FileDownloadIcon />}
                        variant="contained"
                        >
                        Export All Data
                        </Button>
        
                  </div>
        
                );
        
              }}
        
            />
            
            <FullScreenDialog open={isProcViewOpen} setOpen={setProcView} proc={rowData}/>
        </div>
            );
        
        };


export default ProcessTable;