"use client";

import { Autocomplete, TextField } from "@mui/material";
import { styled } from "@mui/material/styles";

const StyledAutocomplete = styled(Autocomplete)({
  "& .MuiOutlinedInput-root": {
    padding: "4px 8px",
    borderRadius: "8px",
    backgroundColor: "white",
    "& fieldset": {
      borderColor: "#d1d5db",
    },
    "&:hover fieldset": {
      borderColor: "#9ca3af",
    },
    "&.Mui-focused fieldset": {
      borderColor: "#3b82f6",
      borderWidth: "2px",
    },
  },
  "& .MuiInputBase-input": {
    fontSize: "0.875rem",
    padding: "4px 8px !important",
  },
  "& .MuiAutocomplete-endAdornment": {
    right: "8px",
  },
});

interface FilterAutocompleteProps {
  label: string;
  options: string[];
  value: string | null;
  onChange: (value: string | null) => void;
  placeholder?: string;
}

export default function FilterAutocomplete({
  label,
  options,
  value,
  onChange,
  placeholder = "Choose option",
}: FilterAutocompleteProps) {
  return (
    <div>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}
      <StyledAutocomplete
        options={options}
        value={value}
        onChange={(_, newValue) => onChange(newValue as string | null)}
        renderInput={(params) => (
          <TextField
            {...params}
            placeholder={placeholder}
            variant="outlined"
            size="small"
          />
        )}
        size="small"
        disableClearable={false}
        sx={{ width: "100%" }}
      />
    </div>
  );
}
