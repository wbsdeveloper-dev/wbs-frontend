"use client";

import { Autocomplete, TextField, Checkbox } from "@mui/material";
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
  value: any;
  onChange: (value: any) => void;
  placeholder?: string;
  multiple?: boolean;
}

export default function FilterAutocomplete({
  label,
  options,
  value,
  onChange,
  placeholder = "Choose option",
  multiple = false,
}: FilterAutocompleteProps) {
  return (
    <div>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}
      <StyledAutocomplete
        multiple={multiple}
        disableCloseOnSelect={multiple}
        options={options}
        value={multiple ? (value || []) : (value || null)}
        onChange={(_, newValue) => onChange(newValue)}
        renderOption={multiple ? (props, option, { selected }) => {
          const { key, ...otherProps } = props as any;
          return (
            <li key={key} {...otherProps}>
              <Checkbox style={{ marginRight: 8 }} checked={selected} size="small" />
              {option}
            </li>
          );
        } : undefined}
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
