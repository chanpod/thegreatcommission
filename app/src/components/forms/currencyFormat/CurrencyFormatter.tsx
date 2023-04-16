// CurrencyFormatter.tsx

import React from "react";

interface CurrencyFormatterProps {
    value: string | number;
}

// Currency formatter component
const CurrencyFormatter: React.FC<CurrencyFormatterProps> = ({ value }) => {
    // Convert the value to a number if it's a string
    const numValue = typeof value === "string" ? parseFloat(value) : value;

    // Check if the value is a valid number
    if (isNaN(numValue)) {
        return <span>Invalid value</span>;
    }

    // Format the value with currency symbol and thousand separators
    const formattedValue = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD", // Change to the desired currency code
        minimumFractionDigits: 2,
    }).format(numValue);

    return <span>{formattedValue}</span>;
};

export default CurrencyFormatter;
