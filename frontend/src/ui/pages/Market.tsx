import React, { useState, useEffect } from "react";
import {
    Box,
    Typography,
    TextField,
    Button,
    List,
    ListItem,
    ListItemText,
    Paper,
    Menu,
    MenuItem,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import SortIcon from "@mui/icons-material/Sort";
import DownloadIcon from "@mui/icons-material/Download";

interface FileItem { // update in the future accordingly as there will be different types and not all string
    id: number;
    name: string;
    size: string;
    type: string;
    dateUploaded: string;
    price: string;
}

const dummyData: { [walletId: string]: FileItem[] } = {
    wallet123: [
        { id: 1, name: "Document.pdf", size: "2MB", type: "PDF", dateUploaded: "2023-10-10", price: "5" },
        { id: 2, name: "Photo.jpg", size: "1.5MB", type: "Image", dateUploaded: "2023-09-15", price: "10" },
    ],
    wallet456: [
        { id: 3, name: "Presentation.pptx", size: "5MB", type: "PowerPoint", dateUploaded: "2023-10-12", price: "15" },
        { id: 4, name: "Spreadsheet.xlsx", size: "3MB", type: "Excel", dateUploaded: "2023-09-25", price: "8" },
    ],
};

const Market: React.FC = () => {
    const [walletId, setWalletId] = useState<string>("");
    const [files, setFiles] = useState<FileItem[] | null>(null);
    const [error, setError] = useState<string>("");
    const [sortAnchorEl, setSortAnchorEl] = useState<null | HTMLElement>(null);
    const allFiles: FileItem[] = Object.values(dummyData).flat();
    
    const sortedFiles = allFiles.sort((a, b) => 
        new Date(b.dateUploaded).getTime() - new Date(a.dateUploaded).getTime()
    );

    useEffect(() => {
        setFiles(sortedFiles);
    }, []);

    const handleSearch = () => {
        if (walletId.trim() === "") {
            setFiles(sortedFiles);
            setError("");
        } else {
            const fetchedFiles = dummyData[walletId.trim()];
            if (fetchedFiles) {
                setFiles(fetchedFiles);
                setError("");
            } else {
                setError("No files found for the provided wallet ID.");
                setFiles(null);
            }
        }
    };

    const handleEnterKey = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            handleSearch();
        }
    };

    const handleDownload = (fileName: string) => {
        console.log(`Downloading file: ${fileName}`);
    };

    const handleSortClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        setSortAnchorEl(event.currentTarget);
    };

    const handleSortClose = () => {
        setSortAnchorEl(null);
    };

    const handleSort = (sortOption: string) => {
        if (files) {
            let sorted: FileItem[] = [];
            switch (sortOption) {
                case "Alphabetically":
                    sorted = [...files].sort((a, b) => a.name.localeCompare(b.name));
                    break;
                case "Price":
                    sorted = [...files].sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
                    break;
                case "Upload Time":
                    sorted = [...files].sort((a, b) => new Date(b.dateUploaded).getTime() - new Date(a.dateUploaded).getTime());
                    break;
                case "Size":
                    sorted = [...files].sort((a, b) => parseFloat(a.size) - parseFloat(b.size));
                    break;
                case "Type":
                    sorted = [...files].sort((a, b) => a.type.localeCompare(b.type));
                    break;
                case "Wallet ID":
                    sorted = [...files].sort((a, b) => a.id - b.id);
                    break;
                default:
                    sorted = files;
            }
            setFiles(sorted);
        }
        handleSortClose();
    };

    return (
        <Box
            sx={{
                m: 4,
                width: "100vw",
            }}
        >
            <Typography variant="h3" sx={{ mb: 3, textAlign: "left" }}>
                Market
            </Typography>

            <Box
                sx={{
                    display: "flex",
                    justifyContent: "center",
                    mb: 3,
                    width: "100%",
                }}
            >
                <Box
                    sx={{
                        display: "flex",
                        width: "100%",
                    }}
                >
                    <TextField
                        label="Search by Wallet ID"
                        variant="outlined"
                        value={walletId}
                        onChange={(e) => setWalletId(e.target.value)}
                        onKeyDown={handleEnterKey}
                        sx={{ width: "100%", mr: 2 }}
                    />
                    <Button
                        variant="contained"
                        color="primary"
                        startIcon={<SearchIcon />}
                        onClick={handleSearch}
                        sx={{ height: "55px", mr: 2 }}
                    >
                        Search
                    </Button>

                    <Button
                        variant="contained"
                        onClick={handleSortClick}
                        sx={{
                            mr: 2,
                            backgroundColor: "#9e9e9e",
                            color: "#ffffff",
                            height: "55px",
                            width: "55px",
                        }}
                    >
                        <SortIcon />
                    </Button>
                    <Menu
                        anchorEl={sortAnchorEl}
                        open={Boolean(sortAnchorEl)}
                        onClose={handleSortClose}
                    >
                        <MenuItem onClick={() => handleSort("Alphabetically")}>Sort Alphabetically</MenuItem>
                        <MenuItem onClick={() => handleSort("Price")}>Sort by Price</MenuItem>
                        <MenuItem onClick={() => handleSort("Upload Time")}>Sort by Upload Time</MenuItem>
                        <MenuItem onClick={() => handleSort("Size")}>Sort by Size</MenuItem>
                        <MenuItem onClick={() => handleSort("Type")}>Sort by Type</MenuItem>
                        <MenuItem onClick={() => handleSort("Wallet ID")}>Sort by Wallet ID</MenuItem>
                    </Menu>
                </Box>
            </Box>

            {error && (
                <Typography
                    variant="body1"
                    color="error"
                    sx={{ textAlign: "center", mb: 2 }}
                >
                    {error}
                </Typography>
            )}

            {files && (
                <Paper
                    elevation={3}
                    sx={{ maxWidth: "100%", margin: "0 auto", p: 2 }}
                >
                    <Typography variant="h5" sx={{ mb: 2 }}>
                        {walletId ? `Files for Wallet ID: ${walletId}` : "All Files"}
                    </Typography>
                    <List>
                        {files.map((file) => (
                            <ListItem key={file.id} divider>
                                <ListItemText
                                    primary={file.name}
                                    secondary={`Wallet ID: ${Object.keys(dummyData).find(walletId => 
                                        dummyData[walletId].some(f => f.id === file.id)
                                    )?.substring(0, 4)}... | Size: ${file.size} | Type: ${file.type} | Uploaded: ${file.dateUploaded} | Price: ${file.price} OTTC`}
                                />
                                <Button
                                    variant="contained"
                                    startIcon={<DownloadIcon />}
                                    sx={{ ml: 2 }}
                                    onClick={() => handleDownload(file.name)}
                                >
                                    Download
                                </Button>
                            </ListItem>
                        ))}
                    </List>
                </Paper>
            )}
        </Box>
    );
};

export default Market;
