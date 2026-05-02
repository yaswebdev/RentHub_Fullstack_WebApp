import React, { useEffect, useMemo, useState } from 'react';
import DatePicker from 'react-datepicker';
import { fr } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { addMonths, startOfMonth } from 'date-fns';
import { cn } from '../lib/utils';

const FLEX_OPTIONS = ['Dates exactes', '± 1 jour', '± 2 jours', '± 3 jours', '± 7 jours', '± 14 jours'];

const isBetween = (date, start, end) => {
  if (!date || !start || !end) return false;
  const time = date.setHours(0, 0, 0, 0);
  const s = start.setHours(0, 0, 0, 0);
  const e = end.setHours(0, 0, 0, 0);
  return time > Math.min(s, e) && time < Math.max(s, e);
};

const isSameDay = (a, b) => {
  if (!a || !b) return false;
  return a.toDateString() === b.toDateString();
};

export const DateRangePicker = ({ startDate, endDate, onChange }) => {
  const [tab, setTab] = useState('dates');
  const [hoverDate, setHoverDate] = useState(null);
  const [flex, setFlex] = useState('Dates exactes');
  const [baseMonth, setBaseMonth] = useState(startOfMonth(new Date()));

  useEffect(() => {
    if (startDate) {
      setBaseMonth(startOfMonth(startDate));
    }
  }, [startDate]);

  const hoverEnd = useMemo(() => {
    if (startDate && !endDate && hoverDate) return hoverDate;
    return null;
  }, [startDate, endDate, hoverDate]);

  const dayClassName = (date) => {
    const inRange = isBetween(date, startDate, endDate || hoverEnd);
    const isStart = isSameDay(date, startDate);
    const isEnd = isSameDay(date, endDate || hoverEnd);

    return cn(
      'rh-day',
      inRange && 'rh-day-range',
      isStart && 'rh-day-start',
      isEnd && 'rh-day-end'
    );
  };

  return (
    <div className="bg-white rounded-3xl">
      <style>{`
        .rh-calendar {
          font-family: inherit;
          background: transparent;
          border: none;
        }
        .rh-calendar .react-datepicker__month-container {
          padding: 0 14px;
        }
        .rh-calendar .react-datepicker__header {
          background: transparent;
          border: none;
          padding: 0;
        }
        .rh-calendar .react-datepicker__day-names,
        .rh-calendar .react-datepicker__week {
          display: grid;
          grid-template-columns: repeat(7, minmax(28px, 1fr));
          gap: 8px;
          justify-items: center;
        }
        .rh-calendar .react-datepicker__day-name,
        .rh-calendar .react-datepicker__day {
          width: 32px;
          height: 32px;
          line-height: 32px;
          margin: 0;
          border-radius: 9999px;
        }
        .rh-calendar .react-datepicker__day-name {
          font-size: 12px;
          color: #94a3b8;
          font-weight: 600;
        }
        .rh-calendar .react-datepicker__day {
          font-size: 13px;
          color: #0f172a;
        }
        .rh-calendar .react-datepicker__day:hover {
          background: #f1f5f9;
        }
        .rh-calendar .react-datepicker__day--outside-month {
          color: #cbd5f5;
        }
        .rh-calendar .react-datepicker__day--disabled {
          color: #cbd5e1;
        }
        .rh-calendar .react-datepicker__current-month {
          font-size: 14px;
          font-weight: 700;
          color: #334155;
        }
        .rh-day-range {
          background: #ffe4e6 !important;
          color: #9f1239 !important;
        }
        .rh-day-start,
        .rh-day-end {
          background: #0f172a !important;
          color: #ffffff !important;
        }
      `}</style>
      <div className="flex items-center justify-center gap-2 mb-6">
        <button
          type="button"
          className={cn(
            'px-6 py-2 rounded-full text-sm font-semibold border',
            tab === 'dates' ? 'border-slate-300 text-slate-900' : 'border-transparent text-slate-400'
          )}
          onClick={() => setTab('dates')}
        >
          Dates
        </button>
        <button
          type="button"
          className={cn(
            'px-6 py-2 rounded-full text-sm font-semibold border',
            tab === 'flex' ? 'border-slate-300 text-slate-900' : 'border-transparent text-slate-400'
          )}
          onClick={() => setTab('flex')}
        >
          Flexible
        </button>
      </div>

      <DatePicker
        selected={startDate}
        onChange={onChange}
        startDate={startDate}
        endDate={endDate}
        selectsRange
        inline
        monthsShown={2}
        minDate={new Date()}
        locale={fr}
        openToDate={baseMonth}
        calendarClassName="rh-calendar"
        wrapperClassName="w-full"
        renderCustomHeader={({
          decreaseMonth,
          increaseMonth,
          prevMonthButtonDisabled,
          nextMonthButtonDisabled,
          customHeaderCount,
        }) => (
          <div className="flex items-center justify-between px-4 pt-2 pb-4">
            {customHeaderCount === 0 ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setBaseMonth((prev) => addMonths(prev, -1));
                    decreaseMonth();
                  }}
                  disabled={prevMonthButtonDisabled}
                  className="h-8 w-8 rounded-full border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                >
                  <ChevronLeft className="h-4 w-4 mx-auto" />
                </button>
                <span className="text-sm font-semibold text-slate-700 capitalize">
                  {baseMonth.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setBaseMonth((prev) => addMonths(prev, 1));
                    increaseMonth();
                  }}
                  disabled={nextMonthButtonDisabled}
                  className="h-8 w-8 rounded-full border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                >
                  <ChevronRight className="h-4 w-4 mx-auto" />
                </button>
              </>
            ) : (
              <span className="text-sm font-semibold text-slate-700 capitalize mx-auto">
                {addMonths(baseMonth, 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
              </span>
            )}
          </div>
        )}
        onMonthChange={(date) => setBaseMonth(startOfMonth(date))}
        onDayMouseEnter={(d) => setHoverDate(d)}
        onMonthMouseLeave={() => setHoverDate(null)}
        dayClassName={dayClassName}
      />

      <div className="flex flex-wrap gap-2 mt-4">
        {FLEX_OPTIONS.map((label) => (
          <button
            key={label}
            type="button"
            onClick={() => setFlex(label)}
            className={cn(
              'text-xs font-semibold px-4 py-2 rounded-full border',
              flex === label
                ? 'border-slate-900 text-slate-900'
                : 'border-slate-200 text-slate-600 hover:border-slate-400'
            )}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
};
