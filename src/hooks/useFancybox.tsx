import { useEffect, useRef, useState } from "react";

import { type FancyboxOptions, Fancybox } from "@fancyapps/ui/dist/fancybox/";
import "@fancyapps/ui/dist/fancybox/fancybox.css";

export default function useFancybox(options: Partial<FancyboxOptions> = {}) {
    const [root, setRoot] = useState<HTMLElement | null>(null);
    const optionsRef = useRef(options);
    optionsRef.current = options;

    useEffect(() => {
        if (!root) {
            return;
        }
        Fancybox.bind(root, "[data-fancybox]", optionsRef.current);
        return () => Fancybox.unbind(root);
    }, [root]);

    return [setRoot] as const;
}