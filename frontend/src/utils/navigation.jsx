'use client';

import React, { useState, useEffect } from 'react';
import NextLink from 'next/link';
import { useRouter, usePathname, useParams as useNextParams } from 'next/navigation';

export const Link = ({ to, href, children, className, onClick, ...props }) => {
  const target = to || href || '#';
  return (
    <NextLink href={target} className={className} onClick={onClick} {...props}>
      {children}
    </NextLink>
  );
};

export const useNavigate = () => {
  const router = useRouter();
  return (to, options) => {
    if (typeof to === 'number') {
      if (typeof window !== 'undefined' && to === -1) {
        window.history.back();
      }
      return;
    }
    if (options?.replace) {
      router.replace(to);
    } else {
      router.push(to);
    }
  };
};

export const useLocation = () => {
  const pathname = usePathname() || '';
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setSearch(window.location.search || '');
    }
  }, [pathname]);

  return { pathname, search };
};

export const useParams = () => {
  const params = useNextParams();
  return params || {};
};

export const useSearchParams = () => {
  const [params, setParams] = useState(() => {
    if (typeof window !== 'undefined') {
      return new URLSearchParams(window.location.search);
    }
    return new URLSearchParams('');
  });

  const pathname = usePathname();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setParams(new URLSearchParams(window.location.search));
    }
  }, [pathname]);

  return [params, () => {}];
};

export const Navigate = ({ to, replace }) => {
  const navigate = useNavigate();
  useEffect(() => {
    navigate(to, { replace });
  }, [to, replace, navigate]);
  return null;
};
