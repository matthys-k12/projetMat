// Préparation des tests web : matchers DOM (toBeInTheDocument…) et nettoyage entre tests.
import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

afterEach(() => cleanup());
