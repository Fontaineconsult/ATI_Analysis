import React, { useState } from 'react';
import { Box, Button, HStack, Input, Link, Text } from '@chakra-ui/react';
import { ExternalLinkIcon } from '@chakra-ui/icons';
import { uploadFile } from '../../../services/api/post';
import { FieldLabel } from './docPrimitives';

/**
 * Canonical managed-file uploader for the Supporting Documentation viewers.
 * Uploads the chosen file's bytes to the content-addressed store and reports the
 * result to the parent via `onUploaded`:
 *   { storage_key, original_filename, content_type, size }
 *
 * Props:
 *   value       Current file metadata (or null/empty) — { storage_key, original_filename, size, ... }.
 *   onUploaded  Called with the file metadata after a successful upload.
 *   onClear     Optional; called to detach the current file.
 *   label       Field label (default "Attached File").
 */
export default function FileUploadField({ value, onUploaded, onClear, label = 'Attached File' }) {
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState(null);

    const handleFile = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(true);
        setError(null);
        try {
            const res = await uploadFile(file); // { key, size, content_type, filename }
            onUploaded({
                storage_key: res.key,
                original_filename: res.filename,
                content_type: res.content_type,
                size: res.size,
            });
        } catch (err) {
            setError('Upload failed — please try again.');
        } finally {
            setUploading(false);
            e.target.value = ''; // let the same file be re-selected
        }
    };

    const hasFile = Boolean(value?.storage_key);
    const downloadUrl = hasFile
        ? `${process.env.REACT_APP_API_URL}/files/${value.storage_key}` +
          (value.original_filename ? `?name=${encodeURIComponent(value.original_filename)}` : '')
        : null;

    return (
        <Box>
            <FieldLabel>{label}</FieldLabel>
            {hasFile ? (
                <HStack spacing={2}>
                    <Link href={downloadUrl} isExternal color="teal.600" fontSize="sm"
                          display="flex" alignItems="center">
                        {value.original_filename || value.storage_key.slice(0, 12)}
                        <ExternalLinkIcon ml={1} />
                    </Link>
                    {value.size != null && (
                        <Text fontSize="xs" color="gray.600">
                            ({Math.max(1, Math.round(value.size / 1024))} KB)
                        </Text>
                    )}
                    {onClear && (
                        <Button size="xs" variant="ghost" colorScheme="red" onClick={onClear}>
                            Remove
                        </Button>
                    )}
                </HStack>
            ) : (
                <Input size="sm" type="file" onChange={handleFile} isDisabled={uploading} pt={1}
                       borderColor="gray.300" />
            )}
            {uploading && <Text fontSize="xs" color="gray.600" mt={1}>Uploading…</Text>}
            {error && <Text fontSize="xs" color="red.500" mt={1}>{error}</Text>}
        </Box>
    );
}
