import React from 'react';
import { Select, FormControl } from '@chakra-ui/react';

function DropdownSelect({ options, initialValue, onChange, label = 'Select status level' }) {
    return (
        <FormControl>
            <Select
                aria-label={label}
                value={initialValue}
                onChange={(e) => onChange(e.target.value)}
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
