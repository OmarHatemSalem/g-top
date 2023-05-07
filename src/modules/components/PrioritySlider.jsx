import * as React from 'react';
import Box from '@mui/material/Box';
import Slider from '@mui/material/Slider';



const PrioritySlider = ({currProcPriority, setProcPriority}) => {
    // React.useEffect(()=>{
    //     console.log(`SelectedValue = ${selectedValue}`);
    // }, [selectedValue])
  return (
    <Box sx={{ width: 300 }}>
      <Slider
        aria-label="Priority"
        defaultValue={currProcPriority}
        getAriaValueText={valuetext}
        valueLabelDisplay="auto"
        step={1}
        marks
        min={currProcPriority}
        max={20}
      />
      {/* <Slider defaultValue={curr} step={10} marks min={10} max={110} disabled /> */}
    </Box>
  );
  function valuetext(value) {
    //   return `${value}°C`;
        setProcPriority(value);
    }
}

export default PrioritySlider;