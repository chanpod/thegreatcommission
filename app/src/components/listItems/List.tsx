import React from "react";

interface ListProps {
	children: React.ReactNode;
	grid?: boolean;
	className?: string;
}

const List = ({ children, grid = true, className = "" }: ListProps) => {
	if (grid) {
		return (
			<div
				className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ${className}`}
			>
				{children}
			</div>
		);
	}

	return <ul className={`space-y-4 ${className}`}>{children}</ul>;
};

export default List;
