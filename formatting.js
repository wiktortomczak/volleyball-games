/* global Intl */

export const PLN = new Intl.NumberFormat('pl-PL', {
  style: 'currency',
  currency: 'PLN',
  currencyDisplay: 'code',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2});

export const PLNshort = new Intl.NumberFormat('pl-PL', {
  style: 'currency',
  currency: 'PLN',
  currencyDisplay: 'code',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2});

export const percentShort = new Intl.NumberFormat('pl-PL', {
  style: 'percent',
  minimumFractionDigits: 0});

export const dateFormat = new Intl.DateTimeFormat('pl-PL', {
  year: 'numeric', month: 'numeric', day: 'numeric',
  timeZone: 'Europe/Warsaw' 
});

export const dateTimeFormat = new Intl.DateTimeFormat('pl-PL', {
  year: 'numeric', month: 'numeric', day: 'numeric',
  hour: 'numeric', minute: 'numeric',
  timeZone: 'Europe/Warsaw' 
});

export const hourMinuteFormat = new Intl.DateTimeFormat('pl-PL', {
  hour: 'numeric', minute: 'numeric',
  timeZone: 'Europe/Warsaw' 
});
