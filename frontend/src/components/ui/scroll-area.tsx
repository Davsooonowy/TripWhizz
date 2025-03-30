import * as React from 'react';
import { ScrollArea as RadixScrollArea, ScrollAreaProps } from '@radix-ui/react-scroll-area';

const ScrollArea = React.forwardRef<React.ElementRef<typeof RadixScrollArea>, ScrollAreaProps>(
  ({ children, ...props }, ref) => (
    <RadixScrollArea ref={ref} {...props}>
      {children}
    </RadixScrollArea>
  )
);

ScrollArea.displayName = 'ScrollArea';

export { ScrollArea };