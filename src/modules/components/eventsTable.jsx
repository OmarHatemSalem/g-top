import MaterialReactTable from 'material-react-table';
import React, { useMemo } from 'react';
import { ExportToCsv } from 'export-to-csv'; //or use your library of choice here
import { invoke } from "@tauri-apps/api/tauri";
import { useState, useEffect } from 'react';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import './eventsTable.css';
//Material-UI Imports

import {

    Box,
  
    Button,
  
    ListItemIcon,
  
    MenuItem,
  
    Typography,
  
    TextField,
  
  } from '@mui/material';
import FullScreenDialog from './Modal';

let data = [
    {
        begin: "403",
        state: "R",
        value: 300,
        description : "good",
        topThree: "1,2,3",
        category: "RAM"
    },
    {
        begin: "403",
        state: "R",
        value: 300,
        description : "good",
        topThree: "1,2,3",
        category: "RAM"
    },
    {
        begin: "403",
        state: "R",
        value: 300,
        description : "good",
        topThree: "1,2,3",
        category: "RAM"
      },
    ]
    



const EventsTable = ({isPause}) => {
  
  
  
  const [events, setEvents] = useState([]);
  const [isProcViewOpen, setProcView] = useState(false);
  const [clickedProc, setClickedProc] = useState({})
  

  async function getEvents() {
    // Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
    
    let event = await invoke("check_event");
    console.log(events.length);
    if (events.length < 5) {
      setEvents(oldEvents => oldEvents.concat(event));
    } else {
      setEvents(oldEvents => oldEvents.slice(1).concat(event));

    }
  }
  
  useEffect(() => {
    if(isPause === true){
      let interval = setInterval(getEvents, 3000);
      return () => {
          clearInterval(interval);
      }

    }


  }, [isPause]
  )
  
  const columns = useMemo(() => [
    {
      accessorKey: 'begin',
      header: 'Start Time',
      size:50,
    },
    {
      accessorKey: 'state',
      header: 'State',
      size:25,
      
    },
    {
      accessorKey: 'category',
      header: 'Category',
      size:25,
      Cell: ({ cell, row }) => {
        console.log(cell.getValue()); 
        (
        <div>
          <strong>{cell.getValue()}</strong>
        </div>
      )},
      
    },
    {
      accessorKey: 'value',
      header: 'Value',
      size:25,
      
    },
    {
      accessorKey: 'top_three',
      header: 'Top Processes',
      size:15,
      Cell: ({ cell, row }) => {
        const [p1, p2, p3] = cell.getValue(); 
        console.log(`p1 is ${p1[0]}`);
        console.log(p2[0]);
        console.log(p3[0]);

        return (
        <div>
          <a className='sus-proc' onClick={()=> {setClickedProc({pid: p1[1], name: p1[0]}); setProcView(true)}}>{p1[0]}</a><br/>
          <a className='sus-proc' onClick={()=> {setClickedProc({pid: p2[1], name: p2[0]}); setProcView(true)}}>{p2[0]}</a><br/>
          <a className='sus-proc' onClick={()=> {setClickedProc({pid: p3[1], name: p3[0]}); setProcView(true)}}>{p3[0]}</a>
        </div>
      )},
      
    },
    {
      accessorKey: 'description',
      header: 'Description',
      size:15,
      // Cell: props => (props.getValue()).toFixed(2)
    }, 
  ],
  [],)
  console.log(`returned  events = ${JSON.stringify(events[0])}`);
  
  
  
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
      // data = events;
      csvExporter.generateCsv(events);
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
            columns={columns} data={/*data*/events}
            enableColumnResizing 
            enableGrouping
            // enablePinning
            // enableRowSelection
            // getRowId={(originalRow) => originalRow.pid}
            enableFilterMatchHighlighting
            initialState={{ sorting : [{id:'begin', desc:true}]}}            
            enableColumnDragging={false} //do not show drag handle buttons, but still show grouping options in column actions menu
            //   initialState={{ columnPinning: { left: ['state'] } }} //pin email column to left by default       
        
            //   renderTopToolbarCustomActions={({ table }) => {
        
            //     const handleKill = () => {
        
            //       table.getSelectedRowModel().flatRows.map((row) => {
        
            //         invoke("kill_proc", {pid : row.getValue("pid")})
        
            //       });
        
            //     };
                
            //     const handleKillAll = () => {
        
            //       table.getSelectedRowModel().flatRows.map((row) => {
        
            //         invoke("kill_proc_rec", {pid : row.getValue("pid")})
        
            //       });
        
            //     };
                
            //     const handlePriority = () => {
        
            //       table.getSelectedRowModel().flatRows.map((row) => {
        
            //         invoke("set_priority", {pid : row.getValue("pid"), priority : 10})
        
            //       });
        
            //     };                

            //     return (
        
            //       <div style={{ display: 'flex', gap: '0.5rem' }}>
        
            //         <Button
        
            //           color="error"
        
            //           disabled={!table.getIsSomeRowsSelected()}
        
            //           onClick={handleKill}
        
            //           variant="contained"
        
            //         >
        
            //           Kill
        
            //         </Button>

            //         <Button
        
            //           color="error"

            //           disabled={!table.getIsSomeRowsSelected()}

            //           onClick={handleKill}

            //           variant="contained"

            //         >

            //           Kill All

            //         </Button>

            //         <Button
        
            //           color="primary"

            //           disabled={!table.getIsSomeRowsSelected()}

            //           onClick={handlePriority}

            //           variant="contained"

            //         >

            //           Decrease Priority

            //         </Button>

            //         <Button
            //             color="primary"
            //             //export all data that is currently in the table (ignore pagination, sorting, filtering, etc.)
            //             onClick={handleExportData}
            //             startIcon={<FileDownloadIcon />}
            //             variant="contained"
            //             >
            //             Export All Data
            //             </Button>
        
            //       </div>
        
            //     );
        
            //   }}
        
            />
        
            < FullScreenDialog open={isProcViewOpen} setOpen={setProcView} proc={clickedProc}/>
            
            </div>
          );
        
        };


export default EventsTable;