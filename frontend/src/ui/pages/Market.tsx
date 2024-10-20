import React, { useState } from "react";
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
    Checkbox,
    Modal,
    Pagination,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import SortIcon from "@mui/icons-material/Sort";
import DownloadIcon from "@mui/icons-material/Download";

interface FileItem {
    id: number;
    name: string;
    size: string;
    type: string;
    dateUploaded: string;
    price: string;
    bundlable: boolean;
}

const ITEMS_PER_PAGE = 7;

const dummyData: { [walletId: string]: FileItem[] } = {
    wallet1: [
        { id: 1, name: "Document.pdf", size: "2MB", type: "PDF", dateUploaded: "2024-10-10", price: "5", bundlable: true },
        { id: 2, name: "Photo.jpg", size: "1.5MB", type: "Image", dateUploaded: "2024-09-15", price: "10", bundlable: false },
        { id: 5, name: "Report.docx", size: "3MB", type: "Word Document", dateUploaded: "2024-10-05", price: "12", bundlable: true },
        { id: 6, name: "Data.csv", size: "1MB", type: "CSV", dateUploaded: "2024-09-20", price: "7", bundlable: true },
        { id: 7, name: "Graph.png", size: "2.5MB", type: "Image", dateUploaded: "2024-09-30", price: "9", bundlable: false },
    ],
    wallet2: [
        { id: 3, name: "Presentation.pptx", size: "5MB", type: "PowerPoint", dateUploaded: "2024-10-12", price: "15", bundlable: true },
        { id: 4, name: "Spreadsheet.xlsx", size: "3MB", type: "Excel", dateUploaded: "2024-09-25", price: "8", bundlable: true },
        { id: 8, name: "Audio.mp3", size: "4MB", type: "Audio", dateUploaded: "2024-08-15", price: "6", bundlable: true },
        { id: 9, name: "Video.mp4", size: "10MB", type: "Video", dateUploaded: "2024-07-10", price: "20", bundlable: false },
        { id: 10, name: "Ebook.epub", size: "2MB", type: "Ebook", dateUploaded: "2024-08-20", price: "4", bundlable: true },
    ],
};

const Market: React.FC = () => {
    const [searchInput, setSearchInput] = useState<string>("");
    const [walletId, setWalletId] = useState<string>("");
    const [files, setFiles] = useState<FileItem[]>(Object.values(dummyData).flat());
    const [error, setError] = useState<string>("");
    const [sortAnchorEl, setSortAnchorEl] = useState<null | HTMLElement>(null);
    const [selectedFiles, setSelectedFiles] = useState<number[]>([]);
    const [checkoutOpen, setCheckoutOpen] = useState<boolean>(false);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [downloadModalOpen, setDownloadModalOpen] = useState<boolean>(false);
    const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
    const [downloadLocation, setDownloadLocation] = useState<string>("");

    const allFiles: FileItem[] = Object.values(dummyData).flat();

    const handleSearch = () => {
        if (searchInput.trim() === "") {
            setFiles(allFiles);
            setError("");
            setWalletId("");
        } else {
            const fetchedFiles = dummyData[searchInput.trim()];
            if (fetchedFiles) {
                setFiles(fetchedFiles);
                setWalletId(searchInput.trim());
                setError("");
            } else {
                setFiles([]);
                setError("No files found for the provided wallet ID.");
                setWalletId(searchInput.trim());
            }
        }
        setCurrentPage(1);
        setSelectedFiles([]);
    };

    const handleEnterKey = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            handleSearch();
        }
    };

    const handleDownload = (file: FileItem) => {
        setSelectedFile(file);
        setDownloadModalOpen(true);
    };

    const handleSelectDownloadLocation = async () => {
        const location = await window.electronAPI.selectDownloadPath();
        if (location) {
            setDownloadLocation(location);
        }
    };

    const handleDownloadConfirm = () => {
        if (selectedFile && downloadLocation) {
            console.log(`Downloading file: ${selectedFile.name} to ${downloadLocation}`);
        }
        setDownloadModalOpen(false);
        setSelectedFile(null);
        setDownloadLocation("");
    };

    const handleDownloadModalClose = () => {
        setDownloadModalOpen(false);
        setSelectedFile(null);
        setDownloadLocation("");
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

    const handleCheckboxChange = (fileId: number) => {
        setSelectedFiles((prevSelected) => {
            if (prevSelected.includes(fileId)) {
                return prevSelected.filter((id) => id !== fileId);
            } else {
                return [...prevSelected, fileId];
            }
        });
    };

    const handleCheckoutOpen = () => {
        setCheckoutOpen(true);
    };

    const handleCheckoutClose = () => {
        setCheckoutOpen(false);
    };

    const handlePageChange = (event: React.ChangeEvent<unknown>, page: number) => {
        setCurrentPage(page);
    };

    const currentFiles = files.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    return (
        <Box sx={{ m: 4, width: "100vw" }}>
            <Typography variant="h3" sx={{ mb: 3, textAlign: "left" }}>
                Market
            </Typography>

            <Box sx={{ display: "flex", justifyContent: "center", mb: 3, width: "100%" }}>
                <Box sx={{ display: "flex", width: "100%" }}>
                    <TextField
                        label="Search by Wallet ID"
                        variant="outlined"
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
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
                        sx={{ mr: 2, backgroundColor: "#9e9e9e", color: "#ffffff", height: "55px", width: "55px" }}
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
                <Typography variant="body1" color="error" sx={{ textAlign: "center", mb: 2 }}>
                    {error}
                </Typography>
            )}

            <Paper elevation={3} sx={{ maxWidth: "100%", margin: "0 auto", p: 2 }}>
                <Typography variant="h5" sx={{ mb: 2 }}>
                    {walletId ? `Files for Wallet ID: ${walletId}` : "All Files"}
                </Typography>
                <List>
                    {currentFiles.map((file) => (
                        <ListItem key={file.id} divider>
                            {walletId && (
                                <Checkbox
                                    checked={selectedFiles.includes(file.id)}
                                    onChange={() => handleCheckboxChange(file.id)}
                                    disabled={!file.bundlable}
                                    sx={{ mr: 2, color: file.bundlable ? "primary.main" : "grey.500", "&.Mui-disabled": { color: "grey.400" }}}
                                />
                            )}
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
                                onClick={() => handleDownload(file)}
                            >
                                Download
                            </Button>
                        </ListItem>
                    ))}
                </List>
                <Pagination
                    count={Math.ceil((files.length || 0) / ITEMS_PER_PAGE)}
                    page={currentPage}
                    onChange={handlePageChange}
                    sx={{ display: "flex", justifyContent: "center", mt: 2 }}
                />
            </Paper>

            <Button
                variant="contained"
                color="primary"
                onClick={handleCheckoutOpen}
                sx={{ position: "fixed", bottom: 20, right: 20 }}
                disabled={!walletId}
            >
                Checkout
            </Button>

            <Modal
                open={downloadModalOpen}
                onClose={handleDownloadModalClose}
                aria-labelledby="download-modal-title"
                aria-describedby="download-modal-description"
            >
                <Box
                    sx={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                        width: 400,
                        bgcolor: "background.paper",
                        boxShadow: 24,
                        p: 4,
                        borderRadius: 2,
                    }}
                >
                    <Typography id="download-modal-title" variant="h6" component="h2">
                        Confirm Download
                    </Typography>
                    <Typography id="download-modal-description" sx={{ mt: 2 }}>
                        {selectedFile && (
                            <>
                                <strong>Name:</strong> {selectedFile.name} <br />
                                <strong>Size:</strong> {selectedFile.size} <br />
                                <strong>Type:</strong> {selectedFile.type} <br />
                                <strong>Uploaded:</strong> {selectedFile.dateUploaded} <br />
                                <strong>Price:</strong> {selectedFile.price} OTTC <br />
                                <strong>Download Location:</strong> {downloadLocation || "Not Selected"}
                            </>
                        )}
                    </Typography>
                    <Box sx={{ display: "flex", justifyContent: "flex-start", mt: 3 }}>
                        <Button onClick={handleSelectDownloadLocation} sx={{ mr: 2 }}>
                            Select Download Location
                        </Button>
                    </Box>
                    <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 3 }}>
                        <Button onClick={handleDownloadModalClose} sx={{ mr: 2 }}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleDownloadConfirm}
                            variant="contained"
                            color="primary"
                            disabled={!downloadLocation} // Disable if download location is not selected
                        >
                            Confirm
                        </Button>
                    </Box>
                </Box>
            </Modal>

            <Modal
                open={checkoutOpen}
                onClose={handleCheckoutClose}
                aria-labelledby="checkout-modal-title"
                aria-describedby="checkout-modal-description"
            >
                <Box
                    sx={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                        width: 400,
                        bgcolor: "background.paper",
                        boxShadow: 24,
                        p: 4,
                        borderRadius: 2,
                    }}
                >
                    <Typography id="checkout-modal-title" variant="h6" component="h2">
                        Checkout
                    </Typography>
                    <Typography id="checkout-modal-description" sx={{ mt: 2 }}>
                        Selected Files:
                    </Typography>
                    <List>
                        {selectedFiles.map((fileId) => {
                            const file = allFiles.find((f) => f.id === fileId);
                            return (
                                file && (
                                    <ListItem key={file.id}>
                                        <ListItemText
                                            primary={file.name}
                                            secondary={`Price: ${file.price} OTTC`}
                                        />
                                    </ListItem>
                                )
                            );
                        })}
                    </List>
                    <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 3 }}>
                        <Button onClick={handleCheckoutClose} sx={{ mr: 2 }}>
                            Cancel
                        </Button>
                        <Button onClick={handleCheckoutClose} variant="contained" color="primary">
                            Confirm
                        </Button>
                    </Box>
                </Box>
            </Modal>
        </Box>
    );
};

export default Market;
