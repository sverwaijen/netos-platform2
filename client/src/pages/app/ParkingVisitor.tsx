import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ParkingVisitor() {
  return (
    <div className="container py-8">
      <Card>
        <CardHeader>
          <CardTitle>Visitor Parking</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Visitor parking registration coming soon.</p>
        </CardContent>
      </Card>
    </div>
  );
}
