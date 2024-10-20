import { Box } from "@mui/material";

interface TabSelectorProps {
    children?: React.ReactNode;
    index: any;
    value: any;
}

const TabSelector: React.FC<TabSelectorProps> = ({ children, index, value }) => {
    return (
        <div
            role="tabselector"
            hidden={value !== index}
            aria-labelledby={`dashboard-tab-${index}`}
        >
            {value === index && <Box sx={{p: -10}}>{children}</Box>}
        </div>
    );
}

export default TabSelector;