import { z } from "zod";

export const updateOrderStatusSchema = z.object({
  status: z.enum(["PLACED", "CONFIRMED", "SHIPPED", "DELIVERED", "CANCELLED"]),
});
