"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Avatar,
  Button,
  Card,
  PageHeader,
  Spinner,
  Table,
  Thead,
  Th,
  Tbody,
  Tr,
  Td,
} from "@/components/ui";
import { SearchIcon } from "@/components/icons";
import { useFamilies } from "@/services/families/families.queries";
import { formatDate } from "@/lib/format";

export default function FamiliesPage() {
  const [term, setTerm] = useState("");
  const [debounced, setDebounced] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setDebounced(term), 250);
    return () => clearTimeout(t);
  }, [term]);

  const { data, isLoading, isError, error, isFetching } = useFamilies(debounced);
  const families = useMemo(() => data ?? [], [data]);

  return (
    <>
      <PageHeader
        title="Families"
        subtitle="Browse family accounts and drill into their subscriptions."
      />

      <Card padded={false} className="overflow-hidden">
        <div className="px-4 pt-3">
          <div className="flex items-center gap-2 rounded-field bg-field px-3 py-2 focus-within:bg-white focus-within:ring-2 focus-within:ring-brand/15">
            <SearchIcon size={16} className="shrink-0 text-faint" />
            <input
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="Search by name, email or phone…"
              className="w-full bg-transparent text-sm text-ink placeholder:text-faint focus:outline-none"
            />
            {isFetching && <Spinner size={14} />}
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-brand">
            <Spinner size={26} />
          </div>
        ) : isError ? (
          <p className="px-5 py-16 text-center text-sm text-red-600">
            {error instanceof Error ? error.message : "Failed to load families."}
          </p>
        ) : families.length === 0 ? (
          <p className="px-5 py-16 text-center text-sm text-muted">
            No families match this search.
          </p>
        ) : (
          <Table>
            <Thead>
              <Tr>
                <Th>Family</Th>
                <Th>Phone</Th>
                <Th>Member since</Th>
                <Th>Cases</Th>
                <Th className="text-right">Action</Th>
              </Tr>
            </Thead>
            <Tbody>
              {families.map((f) => (
                <Tr key={f.id}>
                  <Td>
                    <div className="flex items-center gap-3">
                      <Avatar name={f.name} size="sm" />
                      <div className="min-w-0">
                        <p className="font-medium text-ink">{f.name}</p>
                        <p className="truncate text-xs text-muted">{f.email}</p>
                      </div>
                    </div>
                  </Td>
                  <Td className="text-muted">{f.phone}</Td>
                  <Td className="text-muted">{formatDate(f.memberSince)}</Td>
                  <Td className="text-muted">
                    {f.activeCount} active · {f.subscriptionsCount} total
                  </Td>
                  <Td className="text-right">
                    <Link href={`/families/${f.id}`}>
                      <Button variant="subtle" size="sm">
                        View
                      </Button>
                    </Link>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        )}
      </Card>
    </>
  );
}
