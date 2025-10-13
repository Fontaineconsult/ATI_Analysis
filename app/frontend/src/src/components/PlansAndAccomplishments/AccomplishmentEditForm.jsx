import React, { useState } from 'react';
import {
    VStack,
    HStack,
    FormControl,
    FormLabel,
    Input,
    Textarea,
    Button,
    useToast
} from '@chakra-ui/react';
import { updateAccomplishment } from '../../services/api/put';

function AccomplishmentEditForm({ accomplishment, onClose, onSuccess }) {
    const [formData, setFormData] = useState({
        unique_id: accomplishment.unique_id,
        name: accomplishment.name,
        description: accomplishment.description
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const toast = useToast();

    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            await updateAccomplishment(formData);
            toast({
                title: "Accomplishment updated successfully",
                status: "success",
                duration: 2000,
                isClosable: true,
            });
            onSuccess();
        } catch (error) {
            toast({
                title: "Error updating accomplishment",
                description: error.message,
                status: "error",
                duration: 3000,
                isClosable: true,
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <VStack spacing={3} align="stretch">
            <FormControl>
                <FormLabel fontSize="xs">Name</FormLabel>
                <Input
                    size="sm"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
            </FormControl>
            <FormControl>
                <FormLabel fontSize="xs">Description</FormLabel>
                <Textarea
                    size="sm"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    rows={3}
                />
            </FormControl>
            <HStack justify="flex-end">
                <Button size="xs" onClick={onClose}>Cancel</Button>
                <Button
                    size="xs"
                    colorScheme="blue"
                    onClick={handleSubmit}
                    isLoading={isSubmitting}
                >
                    Save
                </Button>
            </HStack>
        </VStack>
    );
}

export default AccomplishmentEditForm;