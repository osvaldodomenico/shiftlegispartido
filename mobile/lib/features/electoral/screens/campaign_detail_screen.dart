import 'package:flutter/material.dart';

// Placeholder — implementado no Chunk 7
class CampaignDetailScreen extends StatelessWidget {
  final String campaignId;
  const CampaignDetailScreen({super.key, required this.campaignId});

  @override
  Widget build(BuildContext context) {
    return Scaffold(body: Center(child: Text('Campaign $campaignId')));
  }
}
