export class AdminQueries {
  public static readonly listAll = `
    SELECT * FROM cards ORDER BY type, created_at
  `;

  public static readonly add = `
    INSERT INTO cards (type, title, content, example, explanation, category, correct_answer)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *
  `;

  public static readonly update = `
    UPDATE cards
    SET type = $1, title = $2, content = $3, example = $4,
        explanation = $5, category = $6, correct_answer = $7
    WHERE id = $8
    RETURNING *
  `;

  public static readonly remove = `
    DELETE FROM cards WHERE id = $1
  `;
}
