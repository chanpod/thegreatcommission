import { differenceInMonths, parseISO } from "date-fns";
import { type Child, type Room } from "./types";

/**
 * Calculates the age of a child in months based on their date of birth
 */
export function getChildAgeInMonths(dateOfBirth: string): number {
  try {
    const dob = parseISO(dateOfBirth);
    return differenceInMonths(new Date(), dob);
  } catch (error) {
    console.error("Error calculating child age:", error);
    return 0;
  }
}

/**
 * Finds an appropriate room for a child based on their age
 */
export function findRoomForChild(child: Child, availableRooms: Room[]): Room | null {
  if (!child.dateOfBirth || !availableRooms || availableRooms.length === 0) {
    return null;
  }

  const ageInMonths = getChildAgeInMonths(child.dateOfBirth);
  
  // First find rooms where the child's age fits within the min and max age range
  const eligibleRooms = availableRooms.filter(
    room => ageInMonths >= room.minAgeMonths && ageInMonths <= room.maxAgeMonths
  );

  if (eligibleRooms.length === 0) {
    return null;
  }

  // If multiple rooms are eligible, prioritize rooms with fewer children
  // but still below capacity
  return eligibleRooms.sort((a, b) => {
    // If one room is at capacity and the other isn't, prioritize the one that's not at capacity
    if ((a.currentCount || 0) >= a.capacity && (b.currentCount || 0) < b.capacity) {
      return 1;
    }
    if ((b.currentCount || 0) >= b.capacity && (a.currentCount || 0) < a.capacity) {
      return -1;
    }
    
    // Otherwise, choose the room with fewer children
    return (a.currentCount || 0) - (b.currentCount || 0);
  })[0];
}

/**
 * Format phone number for display
 */
export function formatPhoneNumber(phone: string): string {
  if (!phone) return "";
  const digits = phone.replace(/\D/g, "");
  
  if (digits.length < 4) return digits;
  if (digits.length < 7) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
}

/**
 * Normalize phone number to just digits
 */
export function normalizePhoneNumber(phone: string): string {
  return phone.replace(/\D/g, "");
} 