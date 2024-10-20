import React, { useState, useCallback } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { Button, CircularProgress, Snackbar, Alert, SnackbarCloseReason, Tooltip, IconButton } from "@mui/material";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import FileDragDrop from "../components/FileDragDrop";
import TextField from "@mui/material/TextField";
import FormControl from "@mui/material/FormControl";
import FormLabel from "@mui/material/FormLabel";
import RadioGroup from "@mui/material/RadioGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import Radio from "@mui/material/Radio";
import { FileMetadata } from "../interfaces/File";
import { useForm, Controller } from 'react-hook-form';


interface FormData {
  userID: string,
  price: number,
  fileName: string,
  filePath: string,
  fileSize: number,
  fileType: string,
  timestamp: string,
  fileHash: string,
  bundleMode: boolean
}
interface SubmitData {
  price: string;  // Assuming the price is input as a string
  bundleMode: string;
  fileName: string;
}
interface UploadProps{}

const Upload: React.FC<UploadProps> = () => {

    //UseState to hold the file added
    const [fileMetadata, setFileMetadata] = useState<FileMetadata | null>(null);
    const [snackbarOpen, setSnackbarOpen] = useState<boolean>(false);
    const [snackbarMessage, setSnackbarMessage] = useState<string>('');
    const [snackbarColor, setSnackbarColor] = useState<'success' | 'error' | 'info' | 'warning'>('success');

    //Form validation useStates
    const { register, handleSubmit, control, setValue, formState: { errors } } = useForm<SubmitData>();
    const handleCloseSnackbar = (
        event: React.SyntheticEvent<any, Event> | Event,
        reason?: SnackbarCloseReason
    ) => {
        if (reason === 'clickaway') {
        return;
        }
        setSnackbarOpen(false);
    }

    // const handleFileDrop = useCallback(async (file: File) => {
    //     if (!file.path) {
    //         console.error("Problem with file drop");
    //         setSnackbarMessage("Problem with file drop");
    //         setSnackbarColor('error');
    //         setSnackbarOpen(true);
    //         return;
    //     }
    //     setFileMetadata(null);
    //     try {
    //         if (!window.electronAPI || !window.electronAPI.handleDragDrop) {
    //             throw new Error("Electron API not available");
    //         }
    //         console.log("This is file: ", file);
    //         const result = await window.electronAPI.handleDragDrop(file);
    //         console.log("File path: ", file.path);
    //         console.log("Result: ", result);
    //         if (!result) {
    //             throw new Error("Problem with file drop");
    //         }
    //         if (result.fileMetadata) {
    //             console.log("hi");
    //             console.log("File metadata: ", result.fileMetadata);
    //             setFileMetadata(result.fileMetadata);
    //             setSnackbarMessage("File ready for upload");
    //             setSnackbarColor('success');
    //             setSnackbarOpen(true);
    //         }
    //     } catch (err: any) {
    //         console.error("Error with electron API: ", err);
    //         setSnackbarMessage(err.message);
    //         setSnackbarColor('error');
    //         setSnackbarOpen(true);
    //         return;
    //     }
    // }, []);
    const handleFileUpload = async () => {
        setFileMetadata(null);
        try {
            if (!window.electronAPI || !window.electronAPI.selectFile) {
                throw new Error("Electron API not available");
            }
            const result = await window.electronAPI.selectFile();
            if (!result) {
                throw new Error("Problem with file selection");
            }
            if (result.fileMetadata) {
                console.log("file path: ", result.fileMetadata.file_path);
                console.log("File metadata: ", result.fileMetadata);
                setFileMetadata(result.fileMetadata);
                setValue("fileName", result.fileMetadata.file_name);
                setSnackbarMessage("File ready for upload");
                setSnackbarColor('success');
                setSnackbarOpen(true);
            }
        } catch (err: any) {
            console.error("Error with electron API: ", err);
            setSnackbarMessage(err.message);
            setSnackbarColor('error');
            setSnackbarOpen(true);
            return;
        }
    }

    const handleFormSubmit = async (data: SubmitData) => {
        // event.preventDefault();

        // FormData wrap the data
        // const formData = new FormData(event.currentTarget);
        // const userID = "user12345"; // Hardcoded for now
        // const price = parseFloat(formData.get('price') as string);
        // const bundleMode = formData.get('bundleMode') === 'Bundled';
        // const fileName = formData.get('fileName') as string;
        const userID = "user12345"; // Hardcoded for now
        const price = parseFloat(data.price); // Use `data.price` from React Hook Form
        const bundleMode = data.bundleMode === 'Bundled'; // Check the bundle mode from data
        const fileName = data.fileName;

        if (!fileMetadata) {
            setSnackbarMessage("No file has been processed");
            setSnackbarColor('error');
            setSnackbarOpen(true);
            return;
        }

        const postData: FormData = {
            userID,
            price,
            fileName,
            filePath: fileMetadata.file_path,
            fileSize: fileMetadata.file_size,
            fileType: fileMetadata.file_type,
            timestamp: fileMetadata.timestamp,
            fileHash: fileMetadata.file_hash,
            bundleMode
        }
        console.log("PostData: ", postData);
        try {
        const response = await fetch("http://localhost:9378/uploadFile", {
            method: 'POST',
            body: JSON.stringify(postData),
        });
        console.log("Response: ", response);
        setSnackbarMessage("File uploaded successfully");
        setSnackbarColor('success');
        setSnackbarOpen(true);

        } catch(err) {
            console.error("An error occurred when attempting to upload the file.")
            setSnackbarMessage("The following error occurred when attempting to upload the file: " + (err as Error).message);
            setSnackbarColor('error');
            setSnackbarOpen(true);
        }

    }
    return (
        <Box
        sx={{
        width: '100%',             
        maxWidth: '500px',         
        m: '0 auto',               
        p: 2,                      
        textAlign: 'center', 
        }}
        >
            <Box sx={{ m: 1, p: 2, width: '100%', maxWidth: '500px' }}> 
                <Typography variant="h3" sx={{ mb: 2, textAlign: 'center' }}>
                Upload a File
                </Typography>
                <form onSubmit={handleSubmit(handleFormSubmit)}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Controller
                      name="price"
                      control={control}
                      defaultValue=""
                      rules={{
                        required: "Price is required.",
                        pattern: {
                          value: /^[0-9]+(\.[0-9]{1,2})?$/,
                          message: "Price must be a valid number (e.g., 10 or 10.99)."
                        }
                      }}
                    render={({ field }) => (
                      <TextField
                      {...field}
                      id="outlined-price"
                      label="Price (OTTC)"
                      variant="outlined"
                      fullWidth
                      error={!!errors.price}
                      helperText={errors.price ? errors.price.message : ""}
                      required
                  />
                    )}/>
                    <Tooltip title="Whenever someone downloads your file, you will receive the price you set." arrow>
                        <IconButton>
                            <HelpOutlineIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                </Box>
                <FormControl fullWidth sx={{ mb: 2 }}>
                    <FormLabel id="bundle-mode-label">Bundle Mode</FormLabel>
                    <Controller
                      name="bundleMode"
                      control={control}
                      defaultValue="No bundle"
                      rules={{required: "A selected bundle mode is required."}}
                      render={({ field }) => (
                        <RadioGroup
                          {...field}
                          aria-labelledby="bundle-mode-label"
                          row
                        >
                  <FormControlLabel value="No bundle" control={<Radio />} label="No bundle" />
                  <FormControlLabel value="Bundled" control={<Radio />} label="Bundle" />
                </RadioGroup>
              )}
            />
                </FormControl>

                {/* <FileDragDrop onFileDrop={handleFileDrop} /> */}

                <Button variant="contained" sx={{ mt: 2 }} onClick={handleFileUpload} fullWidth>
                    Select File
                </Button>
                
                <Controller
                 name="fileName"
                 control={control}
                 defaultValue={fileMetadata ? fileMetadata.file_name : fileName}
                 rules={{
                  required: "File Name is required.",  // Validation rule for fileName
                  minLength: {
                    value: 3,
                    message: "File Name must be at least 3 characters long."
                  }}}
                 render={({ field }) => (
                    <TextField
                    {...field}
                    id="outlined-file-name"
                    label="File Name"
                    fullWidth
                    required
                    sx={{ mb: 2, mt: 2 }} 
                    onChange={(e) => setValue("fileName", e.target.value)}
                    error={!!errors.fileName}
                    helperText={errors.fileName ? errors.fileName.message : ""}
                />
                 )}/>
                <Button variant="contained" sx={{ mt: 2 }} type="submit" fullWidth>
                    Submit
                </Button>
                </form>
            </Box>
            <Snackbar
                open={snackbarOpen}
                autoHideDuration={6000}
                onClose={handleCloseSnackbar}

            >
                <Alert onClose={handleCloseSnackbar} severity={snackbarColor}>
                    {snackbarMessage}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default Upload;
