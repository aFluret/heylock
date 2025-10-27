-- Создаем RPC функцию для выполнения произвольного SQL
CREATE OR REPLACE FUNCTION execute_raw_sql(sql_query text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result json;
BEGIN
  -- Выполняем запрос и возвращаем результат как JSON
  EXECUTE format('SELECT json_agg(t) FROM (%s) t', sql_query) INTO result;
  
  -- Если результат NULL (нет данных), возвращаем пустой массив
  IF result IS NULL THEN
    result := '[]'::json;
  END IF;
  
  RETURN result;
EXCEPTION
  WHEN OTHERS THEN
    -- В случае ошибки возвращаем информацию об ошибке
    RAISE EXCEPTION 'SQL Error: %', SQLERRM;
END;
$$;

-- Даем права на выполнение функции
GRANT EXECUTE ON FUNCTION execute_raw_sql(text) TO anon;
GRANT EXECUTE ON FUNCTION execute_raw_sql(text) TO authenticated;
GRANT EXECUTE ON FUNCTION execute_raw_sql(text) TO service_role;

-- Тестируем функцию
SELECT execute_raw_sql('SELECT COUNT(*) as total FROM sessions');

-- Должен вернуть что-то вроде: [{"total": 80}]

