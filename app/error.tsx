"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function ErrorPage({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-1 items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Algo ha ido mal</CardTitle>
          <CardDescription>
            Ha ocurrido un error inesperado. Puedes intentarlo de nuevo.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => unstable_retry()} className="w-full">
            Reintentar
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
