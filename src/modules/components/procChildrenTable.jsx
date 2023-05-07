import React from "react";
import './procChildrenTable.css'


const ChildrenTable = ({children})=>{
    console.log("children = ", children);
    return(

        <div className="children-table">
            <>
            {
                children.map((item,index)=>{
                    const [pid, name] = item;
                    return(
                        <div key={index}>
                            <h3>{name} | {pid}</h3>
                        </div>
                    )
                })
            }
            </>
        </div>
    );
}

export default ChildrenTable;