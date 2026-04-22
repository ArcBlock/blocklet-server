export default function usePassportId() {
  const clearPassportId = () => {
    localStorage.removeItem('passportId');
  };
  const setPassportId = (value) => {
    localStorage.setItem('passportId', value);
  };
  const getPassportId = () => {
    const passportId = localStorage.getItem('passportId') || '';
    clearPassportId();
    return passportId;
  };

  return {
    getPassportId,
    setPassportId,
    clearPassportId,
  };
}
