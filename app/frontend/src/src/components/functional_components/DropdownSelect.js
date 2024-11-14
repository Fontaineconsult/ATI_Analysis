import React, { useState } from 'react';
import {Select, Box, FormControl, FormLabel} from '@chakra-ui/react';

function DropdownSelect({ options, initialValue, onChange }) {
    return (
        <FormControl>
            <Select
                id="status-select"
                value={initialValue}
                onChange={(e) => onChange(e.target.value)}
                title="Select Status Level"  // Adds a tooltip-like label
            >
                {options.map((option, index) => (
                    <option key={index} value={option}>
                        {option}
                    </option>
                ))}
            </Select>

        </FormControl>
    );
}

export default DropdownSelect;
