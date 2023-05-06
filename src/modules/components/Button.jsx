import { Button } from '@mui/material';
import React, { useMemo } from 'react';
import { useState, useEffect } from 'react';
import './button.css';

const GenericButton = ({buttonTitle, handler, cssClassName})=>{


    return (
        <Button onClick={handler} className='my-button-class'>
            {buttonTitle}
        </Button>
    )

}


export default GenericButton;