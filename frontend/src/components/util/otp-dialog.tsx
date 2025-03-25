import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { OTPInput, SlotProps } from 'input-otp';
import { useRef, useState } from 'react';
import { KeyRound } from 'lucide-react';
import PropTypes from 'prop-types';

// dummy code for demo purposes
//TODO: replace with actual code, after implementing the backend log for login authentication
const CORRECT_CODE = '6548';

interface OtpDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function OtpDialog({
  isOpen,
  onClose,
  onSuccess,
}: OtpDialogProps) {
  const [value, setValue] = useState('');
  const [hasGuessed, setHasGuessed] = useState<undefined | boolean>(undefined);
  const inputRef = useRef<HTMLInputElement>(null);

  async function onSubmit(e?: React.FormEvent<HTMLFormElement>) {
    e?.preventDefault?.();

    inputRef.current?.select();
    await new Promise((r) => setTimeout(r, 100));

    const isCorrect = value === CORRECT_CODE;
    setHasGuessed(isCorrect);

    if (isCorrect) {
      setValue('');
      setTimeout(() => {
        inputRef.current?.blur();
        onClose();
        onSuccess();
      }, 20);
    } else {
      setValue('');
      setTimeout(() => {
        inputRef.current?.blur();
      }, 20);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="p-4 max-w-sm mx-auto">
        <div className="flex flex-col items-center gap-2">
          <div
            className="flex size-11 shrink-0 items-center justify-center rounded-full border"
            aria-hidden="true"
          >
            <KeyRound
              className="stroke-zinc-800 dark:stroke-zinc-100"
              size={20}
              aria-hidden="true"
            />
          </div>
          <DialogHeader>
            <DialogTitle className="sm:text-center">
              {hasGuessed ? 'Code verified!' : 'Enter confirmation code'}
            </DialogTitle>
            <DialogDescription className="sm:text-center">
              {hasGuessed
                ? 'Your code has been successfully verified.'
                : `Check your email and enter the code`}
            </DialogDescription>
          </DialogHeader>
        </div>

        {hasGuessed ? (
          <div className="flex justify-center"></div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-center">
              <OTPInput
                id="confirmation-code"
                ref={inputRef}
                value={value}
                onChange={setValue}
                containerClassName="flex items-center gap-3 has-disabled:opacity-50"
                maxLength={4}
                onFocus={() => setHasGuessed(undefined)}
                render={({ slots }) => (
                  <div className="flex gap-2">
                    {slots.map((slot, idx) => (
                      <Slot key={idx} {...slot} />
                    ))}
                  </div>
                )}
                onComplete={onSubmit}
              />
            </div>
            {hasGuessed === false && (
              <p
                className="text-muted-foreground text-center text-xs"
                role="alert"
                aria-live="polite"
              >
                Invalid code. Please try again.
              </p>
            )}
            <p className="text-center text-sm">
              <a className="underline hover:no-underline" href="#">
                Resend code
              </a>
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

OtpDialog.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSuccess: PropTypes.func.isRequired,
};

function Slot(props: SlotProps) {
  return (
    <div
      className={cn(
        'border-input bg-background text-foreground flex size-9 items-center justify-center rounded-md border font-medium shadow-xs transition-[color,box-shadow]',
        { 'border-ring ring-ring/50 z-10 ring-[3px]': props.isActive },
      )}
    >
      {props.char !== null && <div>{props.char}</div>}
    </div>
  );
}
