$body = @{
  query = "{ search(query: 'label:bounty is:issue is:open no:assignee', type: ISSUE, first: 20) { nodes { ... on Issue { title url repository { nameWithOwner } } } } }"
} | ConvertTo-Json -Compress

$result = gh api graphql --field query=$body 2>&1
Write-Output $result
