import { useVirtualizer } from "@tanstack/react-virtual";
import { useRef, useEffect, useState } from "react";
import { Button } from "~/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "~/components/ui/dialog";
import { UserAvatar } from "~/src/components/avatar/UserAvatar";
import type { users } from "server/db/schema";

interface MembersListProps {
	title: string;
	members: Array<{
		user: typeof users.$inferSelect;
		role?: string;
	}>;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function MembersList({
	title,
	members,
	open,
	onOpenChange,
}: MembersListProps) {
	const parentRef = useRef<HTMLDivElement>(null);
	const [isReady, setIsReady] = useState(false);

	const virtualizer = useVirtualizer({
		count: members.length,
		getScrollElement: () => parentRef.current,
		estimateSize: () => 60,
		overscan: 5,
	});

	// Initialize when dialog opens
	useEffect(() => {
		if (open) {
			// Small delay to ensure DOM is ready
			const timer = setTimeout(() => {
				virtualizer.measure();
				setIsReady(true);
			}, 0);
			return () => {
				clearTimeout(timer);
				setIsReady(false);
			};
		}
	}, [open, virtualizer]);

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-md">
				<DialogHeader>
					<DialogTitle>{title}</DialogTitle>
				</DialogHeader>
				<div
					ref={parentRef}
					className="relative max-h-[400px] overflow-y-auto my-4"
					style={{ minHeight: Math.min(members.length * 60, 400) }}
				>
					{isReady && (
						<div
							style={{
								height: `${virtualizer.getTotalSize()}px`,
								width: "100%",
								position: "relative",
							}}
						>
							{virtualizer.getVirtualItems().map((virtualRow) => {
								const member = members[virtualRow.index];
								return (
									<div
										key={member.user.id}
										style={{
											position: "absolute",
											top: 0,
											left: 0,
											width: "100%",
											height: `${virtualRow.size}px`,
											transform: `translateY(${virtualRow.start}px)`,
										}}
										className="p-3 hover:bg-accent"
									>
										<div className="flex items-center gap-3">
											<UserAvatar user={member.user} />
											<div className="flex flex-col">
												<span className="font-medium">
													{member.user.firstName} {member.user.lastName}
												</span>
												{member.role && (
													<span className="text-sm text-muted-foreground">
														{member.role}
													</span>
												)}
											</div>
										</div>
									</div>
								);
							})}
						</div>
					)}
				</div>
			</DialogContent>
		</Dialog>
	);
}
