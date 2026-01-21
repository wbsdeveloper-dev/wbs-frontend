"use client";

import { TextField } from "@mui/material";
import { styled } from "@mui/material/styles";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { Dayjs } from "dayjs";

const StyledTextField = styled(TextField)({
  "& .MuiOutlinedInput-root": {
    padding: "4px 8px",
    borderRadius: "8px",
    backgroundColor: "white",
    "& fieldset": {
      borderColor: "#d1d5db", // gray-300
    },
    "&:hover fieldset": {
      borderColor: "#9ca3af", // gray-400
    },
    "&.Mui-focused fieldset": {
      borderColor: "#3b82f6", // blue-500
      borderWidth: "2px",
    },
  },
  "& .MuiInputBase-input": {
    fontSize: "0.875rem",
    padding: "4px 8px !important",
  },
});

interface FilterDatePickerProps {
  label: string;
  value: Dayjs | null;
  onChange: (value: Dayjs | null) => void;
  placeholder?: string;
}

export default function FilterDatePicker({
  label,
  value,
  onChange,
  placeholder = "Select date",
}: FilterDatePickerProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>

      <DatePicker
        value={value}
        onChange={(newValue) => onChange(newValue)}
        slotProps={{
          textField: {
            fullWidth: true,
            size: "small",
            placeholder,
          },
        }}
        slots={{
          textField: StyledTextField,
        }}
      />
    </div>
  );
}
