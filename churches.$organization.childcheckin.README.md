# Printerless Child Check-in System

This module provides a complete printerless child check-in system for churches and organizations. It allows volunteers to quickly check in children, capture photos, and generate QR codes for easy check-out.

## Features

- **Session Management**: Create and manage check-in sessions for different events
- **Child & Guardian Information**: Collect and store essential information about children and their guardians
- **Photo Capture**: Take photos of children and guardians directly from the browser
- **QR Code Generation**: Generate unique QR codes for each check-in that can be texted to parents
- **Authorized Pickup**: Add additional authorized persons who can pick up the child
- **Check-out Verification**: Verify identity during check-out using photos or QR codes
- **Printerless Operation**: No need for name tags or printed materials

## Check-in Process

1. **Create/Select Session**: Start by creating a new check-in session or selecting an existing one
2. **Child Information**: Enter the child's details and take their photo
3. **Guardian Information**: Enter the guardian's details and take their photo
4. **Authorized Pickup**: Optionally add additional authorized pickup persons
5. **Complete Check-in**: Generate a QR code that can be texted to the guardian's phone

## Check-out Process

There are three ways to check out a child:

1. **QR Code Scan**: Guardian shows the QR code received via text message
2. **Name-Based Lookup**: Volunteer searches for the child by name and verifies guardian's photo
3. **Authorized Pickup**: Verify ID of pre-approved pickup person

## Database Schema

The system uses the following tables:

- `children`: Stores information about children
- `guardians`: Stores information about parents/guardians
- `children_to_guardians`: Links children to their guardians
- `checkin_sessions`: Manages check-in sessions
- `child_checkins`: Records individual check-ins
- `authorized_pickup_persons`: Stores additional authorized pickup persons

## Routes

- `/churches/:organization/childcheckin`: Main check-in interface
- `/churches/:organization/childcheckin/list`: List of checked-in children
- `/churches/:organization/childcheckin/verify/:secureId`: QR code verification

## Implementation Notes

- Photos are captured using the device's camera via the `react-webcam` library
- QR codes are generated using `qrcode.react`
- The system is designed to work on tablets and mobile devices
- No physical printing is required, making the process faster and more environmentally friendly

## Future Enhancements

- SMS integration for automatic text messages
- Check-in history and reporting
- Attendance tracking and analytics
- Pre-registration system for faster check-in
- Family check-in (multiple children at once) 