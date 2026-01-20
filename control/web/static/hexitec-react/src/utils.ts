// Utility function that checks if a value is null or undefined. Returns 'null' if yes, value if no
export const checkNull = (val: number) => val === null || val === undefined ? 'null' : val.toFixed(4);

export const checkNullNoDp = (val: number) => val === null || val === undefined ? 'null' : val;

export const floatingLabelStyle = {
    border: '1px solid lightblue',
    backgroundColor: '#e0f7ff',
    borderRadius: '0.375rem'
}

export const floatingInputStyle = {
  border: "1px solid #ced4da", // thin Bootstrap-like grey border
  borderRadius: "0.375rem",    // Bootstrap default rounded corners
};
