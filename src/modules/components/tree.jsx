import { useState, useMemo, useEffect } from "react";
import { invoke } from "@tauri-apps/api/tauri";
import MaterialReactTable from 'material-react-table';

import {

  Box,

  Button,

  ListItemIcon,

  MenuItem,

  Typography,

  TextField,

} from '@mui/material';

const Tree = ({isPause}) => {
    const [tree, setTree] = useState([]);
    const [rowSelection, setRowSelection] = useState({});

    async function getTree() {
        // Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
        
        let newData = await invoke("print_tree"); 

        console.log("got new data\n");
        console.log(newData);
        console.log(tree);
        setTree([newData]);
    }

    useEffect(() => {
      if(isPause === true){
        let interval = setInterval(getTree, 3000);
        return () => {
            clearInterval(interval);
        }
  
      }
  
  
    }, [isPause]
    )
    const columns = useMemo(() => [
        {
          accessorKey: 'record.name',
          header: 'Process',
          size:50,
        },
        {
          accessorKey: 'record.pid',
          header: 'PID',
          size:25,
          
        },
        {
          accessorKey: 'record.state',
          header: 'State',
          size:25,
          
        },
        {
          accessorKey: 'record.priority',
          header: 'Priority',
          size:25,
          
        },
        {
          accessorKey: 'record.parent',
          header: 'Parent',
          size:15,
          
        },
        {
          accessorKey: 'record.cpu_usage',
          header: 'CPU Usage',
          size:15,
          // Cell: props => (props.getValue()).toFixed(2)
          Cell: ({ cell, row }) => (
            <div>
              {cell.getValue().toFixed(2)}
            </div>
          ),
        },
        {
          accessorKey: 'record.mem_usage',
          header: 'MEM Usage',
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

    // setTimeout(1000, getTree);
    return (
        <MaterialReactTable
          columns={columns}
          data={tree}
          enableExpanding
          getSubRows={(originalRow) => originalRow.subRows} //default, can customize
          initialState={{ sorting : [{id:'record.pid', desc:false}]}, {expanded:true}}       
          enablePagination={false}     
          enableRowSelection
          onRowSelectionChange={setRowSelection}

          filterFromLeafRows
          // renderTopToolbarCustomActions={({ table }) => {
            
          //   const handleKill = () => {
              
          //     table.getSelectedRowModel().flatRows.map((row) => {
                
          //       invoke("kill_proc", {pid : row.getValue("pid")});
          //       setRowSelection({});
                
          //     });
              
          //   };

          //   return (
        
          //     <div style={{ display: 'flex', gap: '0.5rem' }}>
    
          //       <Button
    
          //         color="error"
    
          //         disabled={!table.getIsSomeRowsSelected()}
    
          //         onClick={handleKill}
    
          //         variant="contained"
    
          //       >
    
          //         Kill
    
          //       </Button>
          //     </div>
          //   );
          //   }}
            />
            );
      
      
};

export default Tree;