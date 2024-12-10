import React, { useEffect, useState } from "react";
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
import { ShoppingCart, ArrowBack } from "@mui/icons-material";

interface FileItem {
    walletID: string,
    srcID: string,
    price: number,
    fileName: string,
    filePath: string,
    fileSize: number,
    fileType: string,
    timestamp: string,
    fileHash: string,
    bundleMode: boolean
  }

const ITEMS_PER_PAGE = 7;

const Market: React.FC = () => {
    const [searchInput, setSearchInput] = useState<string>("");
    const [walletId, setWalletId] = useState<string>("");
    const [files, setFiles] = useState<FileItem[]>([]);
    const [error, setError] = useState<string>("");
    const [sortAnchorEl, setSortAnchorEl] = useState<null | HTMLElement>(null);
    const [selectedFiles, setSelectedFiles] = useState<String[]>([]);
    const [providers, setProviders] = useState<{ walletID: string }[]>([]);
    const [searchedProviders, setSearchedProviders] = useState<{ walletID: string }[]>([]);
    const [checkoutOpen, setCheckoutOpen] = useState<boolean>(false);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [downloadModalOpen, setDownloadModalOpen] = useState<boolean>(false);
    const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
    const [downloadLocation, setDownloadLocation] = useState<string>("");


    useEffect(() => {
        /* Display list of walletIDs (providers) */
        // Send HTTP request to get list of providers
        const fetchProviders = async () => {
            try {
                const response = await fetch("http://localhost:9378/getOtternetPeers");
                if (!response.ok) {
                    throw new Error("Problem fetching providers");
                }
                const providersData = await response.json();
                console.log("Providers Data: ", providersData);
                const providersMap = providersData.map((walletID: string) => ({ walletID }));

                setProviders(providersMap);
                console.log("Providers: ", providers);
            } catch (err: any) {
                console.error("Error fetching providers: ", err);
            }
        }
        fetchProviders();
    }, []);

    const handleSearch = () => {
        /* Search for provider by walletID */
        if (searchInput.trim() === "") {
            /* set SearchedProviders to nothing */
            setSearchedProviders([]);
            setError("");
        } else {
            const searchedProviders = providers.filter(provider => provider.walletID.includes(searchInput));
            setSearchedProviders(searchedProviders);
            if (searchedProviders.length === 0) {
                setError("No providers found for the provided wallet ID.");
            }
        }
        setWalletId("");
        setCurrentPage(1);
        setSelectedFiles([]);
    };

    const handleCheckCatalog = async (walletID: string) => {
        setWalletId(walletID);
        const response = await fetch(`http://localhost:9378/getCatalog/${walletID}`);
        if (!response.ok) {
            setError("Problem fetching files for the provided wallet ID.");
            setFiles([]);
            setCurrentPage(1);
            setSelectedFiles([]);
            return;
        }  
        const files = await response.json();
        setFiles(files);
        setError("");
        setCurrentPage(1);
        setSelectedFiles([]);
    };

    const handleBackToProviders = () => {
        setError("");
        setWalletId("");
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
        try {
            if (!window.electronAPI || !window.electronAPI.selectDownloadPath) {
                throw new Error("Electron API not available");
            }
            const location = await window.electronAPI.selectDownloadPath();
            if (!location) {
                throw new Error("Problem with selecting download location");
            }
            setDownloadLocation(location);
        } catch (err: any) {
            console.error("Error with selecting download location: ", err);
            return;
        }
    };

    const handleDownloadConfirm = () => {
        if (selectedFile && downloadLocation) {
            console.log(`Downloading file: ${selectedFile.fileName} to ${downloadLocation}`);
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
                    sorted = [...files].sort((a, b) => a.fileName.localeCompare(b.fileName));
                    break;
                case "Price":
                    sorted = [...files].sort((a, b) => (a.price) - (b.price));
                    break;
                case "Upload Time":
                    sorted = [...files].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
                    break;
                case "Size":
                    sorted = [...files].sort((a, b) => (a.fileSize) - (b.fileSize));
                    break;
                case "Type":
                    sorted = [...files].sort((a, b) => a.fileType.localeCompare(b.fileType));
                    break;
                case "Wallet ID":
                    sorted = [...files].sort((a, b) => a.srcID.localeCompare(b.srcID));
                    break;
                default:
                    sorted = files;
            }
            setFiles(sorted);
        }
        handleSortClose();
    };

    const handleCheckboxChange = (fileId: string) => {
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
        setDownloadLocation(""); // Clear the download location when closing the checkout modal
    };

    const handleCheckoutConfirm = () => {
        if (downloadLocation && selectedFiles.length > 0) {
            console.log(`Downloading selected files to ${downloadLocation}`);
        }
        setCheckoutOpen(false);
        setSelectedFiles([]);
        setDownloadLocation("");
    };

    const handlePageChange = (event: React.ChangeEvent<unknown>, page: number) => {
        setCurrentPage(page);
    };

    const calculateTotalCost = () => {
        // const total = selectedFiles.reduce((sum, fileId) => {
        //     const file = allFiles.find((f) => f. === fileId);
        //     return file ? sum + parseFloat(file.price) : sum;
        // }, 0);
        // const discountRate = Math.min(selectedFiles.length * 1, 5); // 1% per file, max 5%
        // const discountedTotal = total * (1 - discountRate / 100);
        // return discountedTotal.toFixed(2);
    };

    const currentFiles = files.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    // const bundlableSelectedFilesCount = selectedFiles.filter(fileId => {
    //     const file = allFiles.find(f => f.id === fileId);
    //     return file?.bundlable;
    // }).length;

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
                    {walletId ? `Files for Wallet ID: ${walletId}` : searchedProviders.length > 0 ? "Search Results" : "All Providers"}
                </Typography>
                {walletId ? (<List>
                    {files.map((file) => (
                        <ListItem key={file.fileHash} divider>
                        <Checkbox
                         checked={selectedFiles.includes(file.fileHash)}
                         onChange={() => handleCheckboxChange(file.fileHash)}
                         disabled={!file.bundleMode}
                         sx={{ mr: 2, color: file.bundleMode ? "primary.main" : "grey.500", "&.Mui-disabled": { color: "grey.400" }}}
                        />
                        <ListItemText
                            primary={file.fileName}
                            secondary={`Size: ${file.fileSize} | Type: ${file.fileType} | Uploaded: ${file.timestamp} | Price: ${file.price} OTTC`}
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
                </List>) : 
                searchedProviders.length > 0 ? (<List>
                    {searchedProviders.map((provider) => (
                        <ListItem key={provider.walletID} divider>
                        <ListItemText
                            primary={`Wallet ID: ${provider.walletID}`}
                        />
                        <Button
                            variant="contained"
                            startIcon={<ShoppingCart />}
                            sx={{ ml: 2 }}
                            onClick={() => handleCheckCatalog(provider.walletID)}
                        >
                            Catalog
                        </Button>
                    </ListItem>
                    ))}    
                </List>) : (<List>
                    {providers.map((provider) => (
                        <ListItem key={provider.walletID} divider>
                        <ListItemText
                            primary={`Wallet ID: ${provider.walletID}`}
                        />
                        <Button
                            variant="contained"
                            startIcon={<ShoppingCart />}
                            sx={{ ml: 2 }}
                            onClick={() => handleCheckCatalog(provider.walletID)}
                        >
                            Catalog
                        </Button>
                    </ListItem>
                    ))}    
                </List>)}
                {walletId && (<Button
                variant="text"
                color="primary"
                startIcon={<ArrowBack />}
                onClick={handleBackToProviders}
                >
                Back to Providers
                </Button>)}
                
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
                //disabled={bundlableSelectedFilesCount < 2} // Disable if less than 2 bundlable files are selected
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
                                <strong>Name:</strong> {selectedFile.fileName} <br />
                                <strong>Size:</strong> {selectedFile.fileSize} <br />
                                <strong>Type:</strong> {selectedFile.fileType} <br />
                                <strong>Uploaded:</strong> {selectedFile.timestamp} <br />
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
                    <Typography id="checkout-modal-description" sx={{ mt: 2, fontWeight: "bold" }}>
                        Selected Files:
                    </Typography>
                    <List>
                        {/* {selectedFiles.map((fileId) => {
                            const file = .find((f) => f.id === fileId);
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
                        })} */}
                    </List>
                    <Box>
                        <Box sx={{ display: "flex" }}>
                            <Typography sx={{ fontWeight: "bold" }}>
                                Download Location:
                            </Typography>
                            <Typography sx={{ mt: 0.01, ml: 1 }}>
                                {downloadLocation || "Not Selected"}
                            </Typography>
                        </Box>
                        <Box>
                            <Button onClick={handleSelectDownloadLocation}>
                                Select Download Location
                            </Button>
                        </Box>
                        <Box sx={{ mt: 2 }}>
                            <Typography sx={{ fontWeight: "bold" }}>
                                Total Cost (after discount):
                            </Typography>
                            <Typography>
                                {} OTTC
                            </Typography>
                        </Box>
                    </Box>
                    <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 3 }}>
                        <Button onClick={handleCheckoutClose} sx={{ mr: 2 }}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleCheckoutConfirm}
                            variant="contained"
                            color="primary"
                            disabled={!downloadLocation || selectedFiles.length === 0} // Disable if no download location or no files are selected
                        >
                            Confirm
                        </Button>
                    </Box>
                </Box>
            </Modal>
        </Box>
    );
};

export default Market;
