'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminUsersRoute() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/admin/employees');
  }, [router]);
  return null;
}
