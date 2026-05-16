import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

class CampaignBudgetBar extends StatelessWidget {
  final double budgetLimit;
  final double budgetSpent;

  const CampaignBudgetBar({
    super.key,
    required this.budgetLimit,
    required this.budgetSpent,
  });

  @override
  Widget build(BuildContext context) {
    final percentage =
        budgetLimit > 0 ? (budgetSpent / budgetLimit).clamp(0.0, 1.0) : 0.0;
    final fmt = NumberFormat.currency(locale: 'pt_BR', symbol: 'R\$');
    final color = percentage > 0.9
        ? Colors.red
        : percentage > 0.7
            ? Colors.orange
            : Colors.green;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
          Text('Orçamento', style: Theme.of(context).textTheme.bodySmall),
          Text(
            '${(percentage * 100).toStringAsFixed(1)}%',
            style: TextStyle(color: color, fontWeight: FontWeight.bold),
          ),
        ]),
        const SizedBox(height: 4),
        LinearProgressIndicator(
          value: percentage,
          color: color,
          backgroundColor: Colors.grey.shade200,
        ),
        const SizedBox(height: 4),
        Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
          Text(fmt.format(budgetSpent),
              style: Theme.of(context).textTheme.bodySmall),
          Text(fmt.format(budgetLimit),
              style: Theme.of(context).textTheme.bodySmall),
        ]),
      ],
    );
  }
}
