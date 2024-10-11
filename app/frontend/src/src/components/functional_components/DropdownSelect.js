import React, { useState } from 'react';
import { Select, Box } from '@chakra-ui/react';

const DropdownSelect = ({ options, initialValue, onChange }) => {
    const [selectedValue, setSelectedValue] = useState(initialValue);

    const handleChange = (event) => {
        const newValue = event.target.value;
        setSelectedValue(newValue);
        onChange(newValue);  // Call parent-provided function to handle the update
    };

    return (
        <Box>
            <Select value={selectedValue} onChange={handleChange}>
                {options.map((option) => (
                    <option key={option} value={option}>
                        {option}
                    </option>
                ))}
            </Select>
        </Box>
    );
};

export default DropdownSelect;
