import { useEffect, useState } from "react";

interface Props<T> {
    value: T;
    debounceDelay: number;
}

const useDebounce = <T,>({ value, debounceDelay }: Props<T>): T => {
    const [debouncedValue, setDebounceValue] = useState<T>(value);

    useEffect(() => {
        const timer = setTimeout((): void => setDebounceValue(value), debounceDelay);
        return (): void => clearTimeout(timer);
    }, [value, debounceDelay]);

    return debouncedValue;
};

export default useDebounce;
