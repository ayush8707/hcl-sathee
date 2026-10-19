import AdminDashboard from "./AdminDashboard";

export default function HCLPartnerDashboard(props) {
  return (
    <AdminDashboard
      {...props}
      variant="partner"
      readOnly
      roleLabel="Partner Portal"
      studentsNavIndex={3}
      attendanceNavIndex={1}
      notificationMessage="Get notified about Announcements and Query replies."
    />
  );
}
