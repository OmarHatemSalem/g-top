import * as React from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import ListItemText from '@mui/material/ListItemText';
import ListItem from '@mui/material/ListItem';
import List from '@mui/material/List';
import Divider from '@mui/material/Divider';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import CloseIcon from '@mui/icons-material/Close';
import Slide from '@mui/material/Slide';
import '../../App.css';
import GenericButton from './Button';
import { useState } from 'react';
import { invoke } from "@tauri-apps/api/tauri";
import GenericGraph from './GenericGraph';
import ChildrenTable from './procChildrenTable';
import { useEffect } from 'react';
import "./Modal.css";
import PriorityChangeModal from './priorityChangeModal';

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const  FullScreenDialog = ({open,setOpen, proc}) => {
    if(!open){
        return;
    }
//   const [open, setOpen] = React.useState(false);
const {pid, name: procName} = proc;

const [childProcs, setChildProcs] = useState([]);
const [isOpen, setIsOpen] = useState(false);

async function handleSetChildProcs(){
  let chilern = await invoke("get_childern",{pid: pid});
  setChildProcs(chilern);
  // return chilern;
}

useEffect(()=>{
  handleSetChildProcs();
},[])

const [currGraph, setGraph] = useState('cpu');

const [isPause, setIsPause] = useState(true); 



  const handlePauseClick = () => {
    setIsPause(!isPause);
    invoke("pause_proc", {pid : pid});
    setOpen(false);
    // console.log(isPause);
  };
  const handleKill = () => {
      invoke("kill_proc", {pid : pid});   
      setOpen(false);

  };

  const handlePauseAllClick = () => {
    setIsPause(!isPause);
    invoke("pause_proc_rec", {pid : pid});
    setOpen(false);
    // console.log(isPause);
  };
  const handleKillAll = () => {
      invoke("kill_proc_rec", {pid : pid});   
      setOpen(false);

  };

  const handlePriority = () => {
    // invoke("kill_proc_rec", {pid : pid});   
    setIsOpen(true);

};
  const handleSetGraph = (graphType)=>{
    setGraph(graphType);
  }

//   console.log('Proc data = ', proc);
  

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <div>
      
      <Dialog
        fullScreen
        open={open}
        onClose={handleClose}
        TransitionComponent={Transition}
      >
        <AppBar sx={{ position: 'relative' }} style={{ background: '#ececec' }}>
          <Toolbar>
            <Typography color="common.black" sx={{ ml: 2, flex: 1 }} variant="h5" component="div">
            {procName} | {pid}
            </Typography>
            <IconButton
              edge="end"
              color="inherit"
              onClick={handleClose}
              aria-label="close"
            >
              <CloseIcon color='#000000' />
            </IconButton>
            {/* <Button autoFocus color="inherit" onClick={handleClose}>
              save
            </Button> */}
          </Toolbar>
        </AppBar>
        <div className='header'>
            <h1>Manage Process</h1>
        </div>
        <div className='headerSecondary'>
        <button onClick={handlePauseClick} className={isPause ? 'pause-button' : 'resume-button'}>
          {isPause ? 'Pause' : 'Resume'}
          </button>  
          <button onClick={handlePauseAllClick} className={isPause ? 'pause-button extra' : 'resume-button extra'}>
          {isPause ? 'Pause Childern' : 'Resume Childern'}
          </button>  
        <button onClick={handleKill} className={'kill-button'}>
          Kill
          </button>
        <button onClick={handleKillAll} className={'kill-button extra'}>
          Kill Children
          </button>
          <button onClick={handlePriority} className={'change-priority-button'}>
          Change Priority
          </button>  

        </div>
        <div className='header'>
            <h1>Resource Usage</h1>
        </div>
        <div className='headerSecondary'>
            <button onClick={()=>handleSetGraph('cpu')} className={currGraph =='cpu' ? 'chip-button selected' : 'chip-button' }>
                CPU
            </button>
            <button onClick={()=>handleSetGraph('memory')} className={currGraph =='memory' ? 'chip-button selected' : 'chip-button' }>
                Memory
            </button>
        </div>
        <div className='container-grid'>
          <div className='col-1'>
            <div style={{ height: '750px', width: '750px',display:'flex', justifyContent: 'center',height:' 500px'}}>
                {
                    currGraph == "cpu" 
                    ? 
                    
                    <GenericGraph isPause={isPause} pid={pid} graphLabel="CPU Usage" index={0} functionName="get_process_data"/> 
                    :
                    <GenericGraph isPause={isPause} pid={pid} graphLabel="Memory Usage" index={1} functionName="get_process_data"/> 

                }
            </div>
          </div>
          <div className='col-2'>
            <div>
              <h1>
                Children Processes
              </h1>
            </div>
            <ChildrenTable children={childProcs}/>
          </div>
          <PriorityChangeModal open={isOpen} setOpen={setIsOpen} selectedProc={proc}/>

        </div>
        
        {/* <List>
          <ListItem button>
            <ListItemText primary="Phone ringtone" secondary="Titania" />
          </ListItem>
          <Divider />
          <ListItem button>
            <ListItemText
              primary="Default notification ringtone"
              secondary="Tethys"
            />
          </ListItem>
        </List> */}
      </Dialog>
    </div>
  );


}
export default FullScreenDialog;