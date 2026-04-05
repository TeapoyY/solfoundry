$query = '{"query":"{ search(query: \"label:bounty is:issue is:open no:assignee\", type: ISSUE, first: 50) { nodes { ... on Issue { title url repository { nameWithOwner } labels { nodes { name } } } } } }"}'
$headers = @{ Authorization = "Bearer $env:GITHUB_TOKEN" }
$response = Invoke-RestMethod -Uri "https://api.github.com/graphql" -Method POST -Headers $headers -ContentType "application/json" -Body $query
$response.data.search.nodes | ConvertTo-Json -Depth 5
