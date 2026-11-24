"use client";
import AccountsTable from "../../components/AccountsTable";

export default function UsersPage({ onStatsChange }) {
  return <AccountsTable mode="user" onStatsChange={onStatsChange} />;
}
