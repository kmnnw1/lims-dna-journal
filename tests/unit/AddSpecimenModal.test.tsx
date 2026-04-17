import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AddSpecimenModal } from '@/components/modals/AddSpecimenModal';

describe('AddSpecimenModal', () => {
	const mockOnClose = vi.fn();
	const mockOnSubmit = vi.fn();
	const mockSetNewRecord = vi.fn();

	const defaultProps = {
		open: true,
		onClose: mockOnClose,
		specimens: [],
		newRecord: {
			id: 'test-id',
			taxon: 'Test Taxon',
			locality: '',
			extrLab: '',
			extrOperator: '',
			extrMethod: '',
			extrDateRaw: '',
		},
		setNewRecord: mockSetNewRecord,
		onSubmit: mockOnSubmit,
		validationError: '',
	};

	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should render modal when open', () => {
		render(<AddSpecimenModal {...defaultProps} />);

		expect(screen.getByText('Новая проба')).toBeInTheDocument();
		expect(screen.getByDisplayValue('test-id')).toBeInTheDocument();
		expect(screen.getByDisplayValue('Test Taxon')).toBeInTheDocument();
	});

	it('should not render when closed', () => {
		render(<AddSpecimenModal {...defaultProps} open={false} />);

		expect(screen.queryByText('Новая проба')).not.toBeInTheDocument();
	});

	it('should call onClose when close button clicked', () => {
		render(<AddSpecimenModal {...defaultProps} />);

		const closeButton = screen.getByLabelText('Закрыть');
		fireEvent.click(closeButton);

		expect(mockOnClose).toHaveBeenCalledTimes(1);
	});

	it('should call onClose when overlay clicked', () => {
		render(<AddSpecimenModal {...defaultProps} />);

		const overlay = screen.getByRole('dialog').parentElement!;
		fireEvent.click(overlay);

		expect(mockOnClose).toHaveBeenCalledTimes(1);
	});

	it('should update ID field', () => {
		render(<AddSpecimenModal {...defaultProps} />);

		const idInput = screen.getByTestId('addspecimen-id');
		fireEvent.change(idInput, { target: { value: 'new-id' } });

		expect(mockSetNewRecord).toHaveBeenCalledWith({
			...defaultProps.newRecord,
			id: 'new-id',
		});
	});

	it('should update taxon field', () => {
		render(<AddSpecimenModal {...defaultProps} />);

		const taxonInput = screen.getByTestId('addspecimen-taxon');
		fireEvent.change(taxonInput, { target: { value: 'New Taxon' } });

		expect(mockSetNewRecord).toHaveBeenCalledWith({
			...defaultProps.newRecord,
			taxon: 'New Taxon',
		});
	});

	it('should display validation error', () => {
		render(<AddSpecimenModal {...defaultProps} validationError="Test error" />);

		expect(screen.getByText('Test error')).toBeInTheDocument();
	});

	it('should call onSubmit when form submitted', () => {
		render(<AddSpecimenModal {...defaultProps} />);

		const form = screen.getByRole('form');
		fireEvent.submit(form);

		expect(mockOnSubmit).toHaveBeenCalledTimes(1);
	});
});
